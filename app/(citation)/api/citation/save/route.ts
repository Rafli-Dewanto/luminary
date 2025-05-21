import { auth } from '@/app/(auth)/auth';
import { getCitationsByUserId, insertCitation } from '@/lib/db/queries';
import { getErrorMessage, logger } from '@/lib/utils';
import type { Pagination } from '@/types/pagination';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { doi, style, content } = await request.json();

    if (!doi || !style || !content) {
      return Response.json(
        { error: 'DOI, citation style, and content are required' },
        { status: 400 },
      );
    }

    await insertCitation({
      userId: session.user.id,
      doi,
      style,
      content,
    });

    return Response.json({
      message: 'Citation saved successfully',
      status: 201,
    });
  } catch (error) {
    const err = getErrorMessage(error);
    return Response.json({ error: err }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      logger.error('Unauthorized');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get('page') || '1');
    const limit = Number.parseInt(searchParams.get('limit') || '10');

    const { citations, hasMore } = await getCitationsByUserId({
      userId: session.user.id,
      page,
      limit,
    });

    const pagination: Pagination = {
      current_page: page,
      total: citations.length,
      per_page: limit,
      has_next_page: hasMore,
      has_prev_page: page > 1,
    };

    return Response.json({
      data: citations,
      meta: pagination,
    });
  } catch (error) {
    const errMessage = getErrorMessage(error);
    return Response.json(
      {
        error: errMessage,
      },
      { status: 500 },
    );
  }
}
