// lib/conversation.ts
import { redis } from './redis';

const MEMORY_LIMIT = 20;

export async function saveToConversationHistory(
  userId: string,
  messages: { role: string; content: string }[]
) {
  const key = `conversation:${userId}`;

  // Append new messages
  await redis.rpush(key, ...messages.map((m) => JSON.stringify(m)));

  // Trim the list to the memory limit
  await redis.ltrim(key, -MEMORY_LIMIT, -1);
}

export async function getConversationHistory(userId: string) {
  const key = `conversation:${userId}`;
  const history = await redis.lrange(key, 0, -1);

  return history.map((item) => JSON.parse(item));
}

export async function clearConversationHistory(userId: string) {
  const key = `conversation:${userId}`;
  await redis.del(key);
}
