import { NextRequest, NextResponse } from 'next/server';
import { deleteLivepeerAsset } from '@/lib/video/livepeer-utils';
import { isAdmin } from '@/lib/auth/admin-utils';
import { revalidateTag } from 'next/cache';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteLivepeerAsset(id);
    
    // Revalidate caches to remove from UI immediately
    revalidateTag('livepeer-assets');
    revalidateTag('livepeer-recorded-sessions');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete asset' },
      { status: 500 }
    );
  }
}

