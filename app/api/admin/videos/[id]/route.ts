import { NextRequest, NextResponse } from 'next/server';
import { deleteLivepeerAsset } from '@/lib/video/livepeer-utils';
import { getSupabaseAdmin } from '@/lib/supabase/server';
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

    const supabase = getSupabaseAdmin();
    
    // 1. Get video to find livepeer_asset_id
    const { data: video, error: fetchError } = await supabase
      .from('videos')
      .select('livepeer_asset_id')
      .eq('id', id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // 2. Delete from Livepeer
    // We ignore 404s from Livepeer (if already deleted) to allow cleanup
    try {
      await deleteLivepeerAsset(video.livepeer_asset_id);
    } catch (lpError: any) {
      console.warn('Livepeer delete warning (proceeding with DB delete):', lpError.message);
    }

    // 3. Delete from Supabase
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // Revalidate caches to remove from UI immediately
    revalidateTag('livepeer-assets');
    revalidateTag('livepeer-videos');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete video' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId || !isAdmin(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price_usd, is_free } = body;

    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase
      .from('videos')
      .update({
        title,
        description,
        price_usd,
        is_free
      })
      .eq('id', id);

    if (error) {
      throw error;
    }

    revalidateTag('livepeer-videos');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating video:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update video' },
      { status: 500 }
    );
  }
}

