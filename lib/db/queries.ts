import 'server-only';

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  lt,
  type SQL,
} from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import {
  user,
  chat,
  type User,
  document,
  type Suggestion,
  suggestion,
  message,
  vote,
  type DBMessage,
  type Chat,
  citation,
} from './schema';
import type { ArtifactKind } from '@/components/artifact';
import { generateUUID, getErrorMessage, logger } from '../utils';
import { generateHashedPassword } from './utils';

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error('Failed to get user from database');
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  const hashedPassword = generateHashedPassword(password);

  try {
    return await db.insert(user).values({ email, password: hashedPassword });
  } catch (error) {
    console.error('Failed to create user in database');
    throw error;
  }
}

export async function createGuestUser() {
  const email = `guest-${Date.now()}`;
  const password = generateHashedPassword(generateUUID());

  try {
    return await db.insert(user).values({ email, password }).returning({
      id: user.id,
      email: user.email,
    });
  } catch (error) {
    console.error('Failed to create guest user in database');
    throw error;
  }
}

export async function saveChat({
  id,
  userId,
  title,
}: {
  id: string;
  userId: string;
  title: string;
}) {
  try {
    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      userId,
      title,
    });
  } catch (error) {
    console.error('Failed to save chat in database');
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    await db.delete(vote).where(eq(vote.chatId, id));
    await db.delete(message).where(eq(message.chatId, id));

    const [chatsDeleted] = await db
      .delete(chat)
      .where(eq(chat.id, id))
      .returning();
    return chatsDeleted;
  } catch (error) {
    console.error('Failed to delete chat by id from database');
    throw error;
  }
}

export async function getChatsByUserId({
  id,
  limit,
  startingAfter,
  endingBefore,
  chatName,
}: {
  id: string;
  limit: number;
  startingAfter: string | null;
  endingBefore: string | null;
  chatName?: string | null;
}) {
  try {
    const extendedLimit = limit + 1;
    const trimmedChatName = chatName?.trim();

    const baseCondition = eq(chat.userId, id);

    const buildConditions = (extraCondition?: SQL) => {
      const conditions = [baseCondition];
      if (extraCondition) {
        conditions.push(extraCondition);
      }
      return conditions;
    };

    const runQuery = (conditions: SQL[]) =>
      db
        .select()
        .from(chat)
        .where(and(...conditions))
        .orderBy(desc(chat.createdAt))
        .limit(extendedLimit);

    let filteredChats: Array<Chat> = [];

    const useChatName = trimmedChatName && trimmedChatName.length > 0;

    const extraCondition = async () => {
      if (startingAfter) {
        const [selectedChat] = await db
          .select()
          .from(chat)
          .where(eq(chat.id, startingAfter))
          .limit(1);
        if (!selectedChat)
          throw new Error(`Chat with id ${startingAfter} not found`);
        return gt(chat.createdAt, selectedChat.createdAt);
      }

      if (endingBefore) {
        const [selectedChat] = await db
          .select()
          .from(chat)
          .where(eq(chat.id, endingBefore))
          .limit(1);
        if (!selectedChat)
          throw new Error(`Chat with id ${endingBefore} not found`);
        return lt(chat.createdAt, selectedChat.createdAt);
      }

      return undefined;
    };

    const condition = await extraCondition();

    if (useChatName) {
      const conditions = buildConditions(condition);
      conditions.push(ilike(chat.title, `%${trimmedChatName}%`));
      filteredChats = await runQuery(conditions);
    } else {
      const conditions = buildConditions(condition);
      filteredChats = await runQuery(conditions);
    }

    const hasMore = filteredChats.length > limit;

    return {
      chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
      hasMore,
    };
  } catch (error) {
    console.error('Failed to get chats by user from database');
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error('Failed to get chat by id from database');
    throw error;
  }
}

export async function updateChatNameById({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  try {
    return await db.update(chat).set({ title: name }).where(eq(chat.id, id));
  } catch (error) {
    console.error('Failed to update chat name in database');
    throw error;
  }
}

export async function saveMessages({
  messages,
}: {
  messages: Array<DBMessage>;
}) {
  try {
    const messagesToSave = messages.map((msg) => ({
      id: msg.id,
      chatId: msg.chatId,
      role: msg.role,
      parts: msg.parts,
      attachments: msg.attachments,
      createdAt: msg.createdAt,
    }));
    return await db.insert(message).values(messagesToSave);
  } catch (error) {
    console.error('Failed to save messages in database', error);
    throw error;
  }
}

export async function getMessagesByChatId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(message)
      .where(eq(message.chatId, id))
      .orderBy(asc(message.createdAt));
  } catch (error) {
    console.error('Failed to get messages by chat id from database', error);
    throw error;
  }
}

export async function voteMessage({
  chatId,
  messageId,
  type,
}: {
  chatId: string;
  messageId: string;
  type: 'up' | 'down';
}) {
  try {
    const [existingVote] = await db
      .select()
      .from(vote)
      .where(and(eq(vote.messageId, messageId)));

    if (existingVote) {
      return await db
        .update(vote)
        .set({ isUpvoted: type === 'up' })
        .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
    }
    return await db.insert(vote).values({
      chatId,
      messageId,
      isUpvoted: type === 'up',
    });
  } catch (error) {
    console.error('Failed to upvote message in database', error);
    throw error;
  }
}

export async function getVotesByChatId({ id }: { id: string }) {
  try {
    return await db.select().from(vote).where(eq(vote.chatId, id));
  } catch (error) {
    console.error('Failed to get votes by chat id from database', error);
    throw error;
  }
}

export async function saveDocument({
  id,
  title,
  kind,
  content,
  userId,
}: {
  id: string;
  title: string;
  kind: ArtifactKind;
  content: string;
  userId: string;
}) {
  try {
    return await db
      .insert(document)
      .values({
        id,
        title,
        kind,
        content,
        userId,
        createdAt: new Date(),
      })
      .returning();
  } catch (error) {
    console.error('Failed to save document in database');
    throw error;
  }
}

export async function getDocumentsById({ id }: { id: string }) {
  try {
    const documents = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(asc(document.createdAt));

    return documents;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function getDocumentById({ id }: { id: string }) {
  try {
    const [selectedDocument] = await db
      .select()
      .from(document)
      .where(eq(document.id, id))
      .orderBy(desc(document.createdAt));

    return selectedDocument;
  } catch (error) {
    console.error('Failed to get document by id from database');
    throw error;
  }
}

export async function deleteDocumentsByIdAfterTimestamp({
  id,
  timestamp,
}: {
  id: string;
  timestamp: Date;
}) {
  try {
    await db
      .delete(suggestion)
      .where(
        and(
          eq(suggestion.documentId, id),
          gt(suggestion.documentCreatedAt, timestamp),
        ),
      );

    return await db
      .delete(document)
      .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
      .returning();
  } catch (error) {
    console.error(
      'Failed to delete documents by id after timestamp from database',
    );
    throw error;
  }
}

export async function saveSuggestions({
  suggestions,
}: {
  suggestions: Array<Suggestion>;
}) {
  try {
    return await db.insert(suggestion).values(suggestions);
  } catch (error) {
    console.error('Failed to save suggestions in database');
    throw error;
  }
}

export async function getSuggestionsByDocumentId({
  documentId,
}: {
  documentId: string;
}) {
  try {
    return await db
      .select()
      .from(suggestion)
      .where(and(eq(suggestion.documentId, documentId)));
  } catch (error) {
    console.error(
      'Failed to get suggestions by document version from database',
    );
    throw error;
  }
}

export async function getMessageById({ id }: { id: string }) {
  try {
    const [selectedMessage] = await db
      .select()
      .from(message)
      .where(eq(message.id, id));
    return selectedMessage;
  } catch (error) {
    console.error('Failed to get message by id from database');
    throw error;
  }
}

export async function deleteMessagesByChatIdAfterTimestamp({
  chatId,
  timestamp,
}: {
  chatId: string;
  timestamp: Date;
}) {
  try {
    const messagesToDelete = await db
      .select({ id: message.id })
      .from(message)
      .where(
        and(eq(message.chatId, chatId), gte(message.createdAt, timestamp)),
      );

    const messageIds = messagesToDelete.map((message) => message.id);

    if (messageIds.length > 0) {
      await db
        .delete(vote)
        .where(
          and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds)),
        );

      return await db
        .delete(message)
        .where(
          and(eq(message.chatId, chatId), inArray(message.id, messageIds)),
        );
    }
  } catch (error) {
    console.error(
      'Failed to delete messages by id after timestamp from database',
    );
    throw error;
  }
}

export async function updateChatVisiblityById({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: 'private' | 'public';
}) {
  try {
    return await db.update(chat).set({ visibility }).where(eq(chat.id, chatId));
  } catch (error) {
    console.error('Failed to update chat visibility in database');
    throw error;
  }
}

export async function getMessageCountByUserId({
  id,
  differenceInHours,
}: {
  id: string;
  differenceInHours: number;
}) {
  try {
    const twentyFourHoursAgo = new Date(
      Date.now() - differenceInHours * 60 * 60 * 1000,
    );

    const [stats] = await db
      .select({ count: count(message.id) })
      .from(message)
      .innerJoin(chat, eq(message.chatId, chat.id))
      .where(
        and(
          eq(chat.userId, id),
          gte(message.createdAt, twentyFourHoursAgo),
          eq(message.role, 'user'),
        ),
      )
      .execute();

    return stats?.count ?? 0;
  } catch (error) {
    console.error(
      'Failed to get message count by user id for the last 24 hours from database',
    );
    throw error;
  }
}

export async function insertCitation({
  userId,
  doi,
  style,
  content,
}: {
  userId: string;
  doi: string;
  style: string;
  content: string;
}) {
  try {
    return await db.insert(citation).values({
      userId,
      doi,
      style,
      content,
      createdAt: new Date(),
    });
  } catch (error) {
    logger.error(
      'Failed to insert citation in database',
      getErrorMessage(error),
    );
    throw error;
  }
}

export async function getCitationsByUserId({
  userId,
  page = 1,
  limit = 10,
  sortBy = 'date',
}: {
  userId: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'alpha';
}) {
  try {
    const offset = (page - 1) * limit;
    const extendedLimit = limit + 1;

    const query = db.select().from(citation).where(eq(citation.userId, userId));

    if (sortBy === 'alpha') {
      query.orderBy(asc(citation.content));
    } else {
      query.orderBy(desc(citation.createdAt));
    }

    const citations = await query.limit(extendedLimit).offset(offset);

    const hasMore = citations.length > limit;

    return {
      citations: hasMore ? citations.slice(0, limit) : citations,
      hasMore,
    };
  } catch (error) {
    logger.error('Failed to get citations by user from database');
    throw error;
  }
}

export async function deleteCitation({
  userId,
  id,
}: {
  userId: string;
  id: string;
}) {
  try {
    return await db
      .delete(citation)
      .where(and(eq(citation.userId, userId), eq(citation.id, id)));
  } catch (error) {
    logger.error(
      'Failed to delete citation from database',
      getErrorMessage(error),
    );
    throw error;
  }
}

export async function getAllCitationsByUserId(userId: string) {
  try {
    return await db
      .select()
      .from(citation)
      .where(eq(citation.userId, userId))
      .orderBy(asc(citation.content));
  } catch (error) {
    logger.error('Failed to get all citations by user from database');
    throw error;
  }
}
