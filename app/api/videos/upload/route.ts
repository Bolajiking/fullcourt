import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';
import { isAdmin } from '@/lib/auth/admin-utils';
import { Livepeer } from 'livepeer';

/**
 * POST /api/videos/upload
 * Upload a video file to Livepeer and create a record in Supabase
 * 
 * According to Livepeer docs: https://docs.livepeer.org/guides/developing/upload-a-video-asset
 * Livepeer requires a two-step process:
 * 1. Create asset and get upload URL
 * 2. Upload file using TUS protocol
 * 
 * For MVP, we'll use the SDK to create the asset, then handle the TUS upload
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Video Upload] Request received');
    
    // Check admin access
    const userId = request.headers.get('x-user-id');
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Get request body - can be JSON (for client-side upload) or FormData (legacy)
    let title: string;
    let description: string;
    let price: string;
    let isFree: boolean;
    let thumbnail: string | null = null;
    let file: File | null = null;

    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // New approach: JSON body for client-side upload
      const body = await request.json();
      title = body.title;
      description = body.description;
      price = body.price;
      isFree = body.isFree === true;
      thumbnail = body.thumbnail || null; // This is base64 data URL
    } else {
      // Legacy approach: FormData (for backward compatibility)
      const formData = await request.formData();
      file = formData.get('file') as File;
      title = formData.get('title') as string;
      description = formData.get('description') as string;
      price = formData.get('price') as string;
      isFree = formData.get('isFree') === 'true';
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!serverEnv.livepeerApiKey) {
      return NextResponse.json(
        { error: 'Livepeer API key not configured' },
        { status: 500 }
      );
    }

    console.log('[Video Upload] Creating asset:', { 
      title,
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
    });

    // Initialize Livepeer SDK
    const livepeer = new Livepeer({
      apiKey: serverEnv.livepeerApiKey,
    });

    // Step 1: Request upload URL from Livepeer
    // This creates an asset and returns a TUS upload URL
    // Note: When using JSON (client-side upload), file is null - client will upload directly
    const assetResult = await livepeer.asset.create({
      name: title.trim() || file?.name || 'Untitled Video',
    });

    console.log('[Video Upload] Asset creation result structure:', {
      hasData: !!assetResult.data,
      keys: Object.keys(assetResult),
      statusCode: assetResult.statusCode,
    });

    // The Livepeer SDK v3.5.0+ returns: { data: { asset: {...}, tusEndpoint: "..." }, statusCode, ... }
    if (!assetResult.data) {
      console.error('[Video Upload] No data in asset result:', JSON.stringify(assetResult, null, 2));
      return NextResponse.json(
        { error: 'Failed to create asset in Livepeer - no data returned' },
        { status: 500 }
      );
    }

    const asset = assetResult.data.asset;
    const assetId = asset.id;
    const tusEndpoint = assetResult.data.tusEndpoint;

    console.log('[Video Upload] Asset created:', { assetId, hasTusEndpoint: !!tusEndpoint });

    // Step 2: Return TUS endpoint to client for direct upload
    // Client-side upload is much faster as it uploads directly to Livepeer
    // without going through our server, avoiding bandwidth bottlenecks

    // Step 3: Handle thumbnail upload to Supabase Storage (if provided)
    const supabase = getSupabaseAdmin();
    let thumbnailUrl: string | null = null;
    
    if (thumbnail && thumbnail.startsWith('data:')) {
      try {
        // Extract base64 data
        const matches = thumbnail.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          const mimeType = matches[1];
          const base64Data = matches[2];
          const buffer = Buffer.from(base64Data, 'base64');
          
          // Generate unique filename
          const extension = mimeType.split('/')[1];
          const filename = `thumbnails/${assetId}.${extension}`;
          
          // Upload to Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('videos')
            .upload(filename, buffer, {
              contentType: mimeType,
              upsert: true, // Overwrite if exists
            });
          
          if (uploadError) {
            console.error('[Thumbnail Upload] Error:', uploadError);
          } else {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('videos')
              .getPublicUrl(filename);
            
            thumbnailUrl = publicUrl;
            console.log('[Thumbnail Upload] Success:', publicUrl);
          }
        }
      } catch (error) {
        console.error('[Thumbnail Upload] Failed to process base64:', error);
      }
    }
    
    // Extract metadata from asset
    const playbackId = asset.playbackId || null;
    
    // Livepeer's default thumbnail endpoint
    const livepeerThumbnailUrl = `https://lp-assets.livepeer.studio/api/asset/${assetId}/thumbnail.jpg`;
    
    // Status is always 'processing' initially after asset creation
    const status = 'processing';

    // Prioritize: 1) Uploaded thumbnail URL, 2) Livepeer's standard thumbnail endpoint
    const finalThumbnail = thumbnailUrl || livepeerThumbnailUrl;

    const { data: video, error: dbError } = await supabase
      .from('videos')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        livepeer_asset_id: assetId,
        price_usd: parseFloat(price) || 0,
        is_free: isFree,
        thumbnail_url: finalThumbnail,
        status,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Video Upload] Database error:', dbError);
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    console.log('[Video Upload] Video record created:', video.id);

    return NextResponse.json({
      success: true,
      videoId: video.id,
      livepeerAssetId: assetId,
      tusEndpoint: tusEndpoint || undefined,
      message: 'Video asset created. Upload in progress...',
    });
  } catch (error) {
    console.error('[Video Upload] Upload error:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.stack : String(error))
          : undefined,
      },
      { status: 500 }
    );
  }
}
