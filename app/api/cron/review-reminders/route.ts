import { NextRequest, NextResponse } from 'next/server';
import { processCompletedReservationsForReviewEmails } from '@/lib/services/reviews/processCompletedReservationsForReviewEmails';

export async function GET(req: NextRequest) {
  try {
    const secret = process.env.CRON_SECRET;

    // if (secret) {
    //   const authHeader = req.headers.get('authorization');
    //   if (authHeader !== `Bearer ${secret}`) {
    //     return NextResponse.json(
    //       { ok: false, error: 'Unauthorized' },
    //       { status: 401 },
    //     );
    //   }
    // }
    console.log('CRON_SECRET=', process.env.CRON_SECRET);
    console.log('AUTH_HEADER=', req.headers.get('authorization'));
    const result = await processCompletedReservationsForReviewEmails();

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Cron review-reminders error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Failed to process review reminders',
      },
      { status: 500 },
    );
  }
}
