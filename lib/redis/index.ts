import { Redis } from '@upstash/redis';

const redisURL = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL;
if (!redisURL) {
  console.error('UPSTASH_REDIS_REST_URL is not defined', redisURL);
  
  throw new Error('UPSTASH_REDIS_REST_URL is not defined');
}

const redisToken = process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN;
if (!redisToken) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined');
}

export const redis = new Redis({
  url: redisURL,
  token: redisToken,
});

