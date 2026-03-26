import { NextRequest, NextResponse } from 'next/server';
import {
  getReviewLinkData,
  submitReviewFromLink,
} from '@/lib/services/reviews/reviewLinkService';
import { handleReviewLinkError } from '@/lib/errors/handleReviewLinkError';

type Params = {
  params: Promise<{
    token: string;
  }>;
};

export async function GET(_: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const result = await getReviewLinkData(token);
    return NextResponse.json(result);
  } catch (error: any) {
    return handleReviewLinkError(error, 'GET');
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;
    const body = await req.json();

    const result = await submitReviewFromLink(token, {
      rating: body?.rating,
      comment: body?.comment,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return handleReviewLinkError(error, 'POST');
  }
}
