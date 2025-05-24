import { auth } from '@/app/(auth)/auth';
import { deleteCitation } from '@/lib/db/queries';
import { getErrorMessage } from '@/lib/utils';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    if (Number.isNaN(id)) {
      return Response.json({ error: 'Invalid citation ID' }, { status: 400 });
    }

    await deleteCitation({
      userId: session.user.id,
      id,
    });

    return Response.json({
      message: 'Citation deleted successfully',
      status: 200,
    });
  } catch (error) {
    const err = getErrorMessage(error);
    return Response.json({ error: err }, { status: 500 });
  }
}
