import { NextRequest, NextResponse } from 'next/server';
import { getLivepeerVideos, getRecordedSessions } from '@/lib/video/livepeer-data';

export async function GET(request: NextRequest) {
  // This data is public on the site anyway, so we don't strictly need admin check for *reading* 
  // (unless we want to show hidden/error items later).
  // For now, we just return the lists for the admin dashboard.
  
  // Fetch a larger limit for admin management
  const videos = await getLivepeerVideos(100);
  const recordings = await getRecordedSessions(100);

  return NextResponse.json({ videos, recordings });
}

