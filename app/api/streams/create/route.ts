import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';
import { isAdmin } from '@/lib/auth/admin-utils';

const LIVEPEER_API_URL = 'https://livepeer.studio/api';

/**
 * Get Livepeer API headers
 */
function getLivepeerHeaders() {
  if (!serverEnv.livepeerApiKey) {
    throw new Error('Livepeer API key not configured');
  }
  return {
    'Authorization': `Bearer ${serverEnv.livepeerApiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * POST /api/streams/create
 * Create a new live stream in Livepeer and store metadata in Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin access
    const userId = request.headers.get('x-user-id');
    if (!userId || !isAdmin(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, price, isFree } = body;

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

    // Step 1: Check if admin user already has a stream, or create a new one
    const supabase = getSupabaseAdmin();
    
    // Check for existing stream for this admin user
    const { data: existingStream } = await supabase
      .from('streams')
      .select('*')
      .eq('admin_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let streamId: string;
    let streamKey: string;
    let rtmpUrl: string;
    let playbackId: string | null = null;

    if (existingStream) {
      // Reuse existing stream
      streamId = existingStream.livepeer_stream_id;
      streamKey = existingStream.stream_key;
      rtmpUrl = existingStream.rtmp_ingest_url;
      
      // Fetch current stream details from Livepeer to get playback ID
      try {
        const streamResponse = await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
          method: 'GET',
          headers: getLivepeerHeaders(),
        });
        
        if (streamResponse.ok) {
          const livepeerStream = await streamResponse.json();
          playbackId = livepeerStream.playbackId || livepeerStream.stream?.playbackId || null;
        }
      } catch (error) {
        console.error('Error fetching stream details:', error);
      }
    } else {
      // Create new stream in Livepeer
      const streamResponse = await fetch(`${LIVEPEER_API_URL}/stream`, {
        method: 'POST',
        headers: getLivepeerHeaders(),
        body: JSON.stringify({
          name: `Admin Stream - ${userId.substring(0, 8)}`,
          record: true, // Record the stream for VOD
        }),
      });

      if (!streamResponse.ok) {
        const error = await streamResponse.text();
        console.error('Livepeer API error:', error);
        return NextResponse.json(
          { error: `Livepeer stream creation failed: ${streamResponse.statusText}` },
          { status: 500 }
        );
      }

      const livepeerStream = await streamResponse.json();
      
      // Extract stream details from Livepeer response
      streamId = livepeerStream.id || livepeerStream.stream?.id;
      streamKey = livepeerStream.streamKey || livepeerStream.stream?.streamKey;
      rtmpUrl = livepeerStream.rtmpIngestUrl || livepeerStream.stream?.rtmpIngestUrl;
      playbackId = livepeerStream.playbackId || livepeerStream.stream?.playbackId || null;
      
      if (!streamId || !streamKey || !rtmpUrl) {
        console.error('Livepeer response:', livepeerStream);
        return NextResponse.json(
          { error: 'Failed to get stream details from Livepeer' },
          { status: 500 }
        );
      }
    }

    // Step 2: Create or update stream record in Supabase
    let stream;
    let dbError;
    
    if (existingStream) {
      // Update existing stream with new session info
      const { data, error } = await supabase
        .from('streams')
        .update({
          title: title.trim(),
          description: description?.trim() || null,
          price_usd: parseFloat(price) || 0,
          is_free: isFree !== false,
          is_live: false, // Will be updated when stream goes live
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingStream.id)
        .select()
        .single();
      
      stream = data;
      dbError = error;
    } else {
      // Create new stream record
      const { data, error } = await supabase
        .from('streams')
        .insert({
          title: title.trim(),
          description: description?.trim() || null,
          livepeer_stream_id: streamId,
          rtmp_ingest_url: rtmpUrl,
          stream_key: streamKey,
          admin_user_id: userId, // Store admin user ID for reuse
          price_usd: parseFloat(price) || 0,
          is_free: isFree !== false,
          is_live: false, // Will be updated when stream goes live
        })
        .select()
        .single();
      
      stream = data;
      dbError = error;
    }

    if (dbError) {
      console.error('Database error:', dbError);
      // Try to delete the Livepeer stream if database insert fails
      try {
        await fetch(`${LIVEPEER_API_URL}/stream/${streamId}`, {
          method: 'DELETE',
          headers: getLivepeerHeaders(),
        });
      } catch (cleanupError) {
        console.error('Failed to cleanup Livepeer stream:', cleanupError);
      }
      
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      streamId: stream.id,
      rtmpUrl,
      streamKey,
      playbackId: playbackId || null,
      message: 'Stream created successfully',
    });
  } catch (error) {
    console.error('Stream creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

