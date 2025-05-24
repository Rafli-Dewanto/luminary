import { auth } from '@/app/(auth)/auth';
import { getAllCitationsByUserId } from '@/lib/db/queries';
import { getErrorMessage } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const citations = await getAllCitationsByUserId(session.user.id);
    const formattedCitations = citations.map((c) => c.content).join('\n\n');

    return new Response(formattedCitations, {
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': 'attachment; filename="citations.txt"',
      },
    });
  } catch (error) {
    const err = getErrorMessage(error);
    return Response.json({ error: err }, { status: 500 });
  }
}
