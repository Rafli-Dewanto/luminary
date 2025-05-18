import { auth } from '@/app/(auth)/auth';
import { getMessageById } from '@/lib/db/queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const messageId = searchParams.get('messageId');

  if (!messageId) {
    return new Response('Missing messageId', { status: 400 });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const message = await getMessageById({ id: messageId });

  if (!message) {
    return new Response('Message not found', { status: 404 });
  }

  return Response.json(message || [], { status: 200 });
}
