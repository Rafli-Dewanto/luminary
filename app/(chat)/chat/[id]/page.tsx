import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { getChatById, getMessagesByChatId } from '@/lib/db/queries';
import type { DBMessage } from '@/lib/db/schema';
import type { Attachment, UIMessage } from 'ai';
import ClientOnly from '@/components/shared/client-only';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { id } = params;
  const chat = await getChatById({ id });

  const messages = await getMessagesByChatId({ id });
  let attachmentUrl = '';
  for (const message of messages) {
    const attachments = (message.attachments as Attachment[]) ?? [];
    if (attachments.length > 0 && attachments[0]?.url) {
      attachmentUrl = attachments[0].url;
      break;
    }
  }

  if (!chat) {
    notFound();
  }

  const session = await auth();

  if (!session) {
    redirect('/api/auth/guest');
  }

  if (chat.visibility === 'private') {
    if (!session.user) {
      return notFound();
    }

    if (session.user.id !== chat.userId) {
      return notFound();
    }
  }

  const messagesFromDb = await getMessagesByChatId({
    id,
  });

  function convertToUIMessages(messages: Array<DBMessage>): Array<UIMessage> {
    return messages.map((message) => ({
      id: message.id,
      parts: message.parts as UIMessage['parts'],
      role: message.role as UIMessage['role'],
      // Note: content will soon be deprecated in @ai-sdk/react
      content: '',
      createdAt: message.createdAt,
      experimental_attachments:
        (message.attachments as Array<Attachment>) ?? [],
    }));
  }

  const cookieStore = await cookies();
  const chatModelFromCookie = cookieStore.get('chat-model');

  if (!chatModelFromCookie) {
    return (
      <>
        <ClientOnly>
          <Chat
            id={chat.id}
            attachmentUrl={attachmentUrl}
            initialMessages={convertToUIMessages(messagesFromDb)}
            selectedChatModel={DEFAULT_CHAT_MODEL}
            selectedVisibilityType={chat.visibility}
            isReadonly={session?.user?.id !== chat.userId}
            session={session}
          />
        </ClientOnly>
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <ClientOnly>
        <Chat
          id={chat.id}
          attachmentUrl={attachmentUrl}
          initialMessages={convertToUIMessages(messagesFromDb)}
          selectedChatModel={chatModelFromCookie.value}
          selectedVisibilityType={chat.visibility}
          isReadonly={session?.user?.id !== chat.userId}
          session={session}
        />
      </ClientOnly>
      <DataStreamHandler id={id} />
    </>
  );
}
