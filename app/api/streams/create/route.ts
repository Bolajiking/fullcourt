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
    console.log('Stream creation request received');
    
    // Check admin access
    const userId = request.headers.get('x-user-id');
    console.log('User ID from headers:', userId);
    
    if (!userId || !isAdmin(userId)) {
      console.error('Unauthorized stream creation attempt');
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, price, isFree, recordEnabled } = body;
    const record = recordEnabled !== undefined ? Boolean(recordEnabled) : true;
    console.log('Stream request body:', { title, price, isFree, record });
    
    const numericPrice =
      typeof price === 'number'
        ? price
        : parseFloat(price ?? '0') || 0;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!serverEnv.livepeerApiKey) {
      console.error('Livepeer API key missing');
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
      
    console.log('Existing stream found:', existingStream ? existingStream.id : 'None');

    let streamId: string | null = null;
    let streamKey: string | null = null;
    let rtmpUrl: string | null = null;
    let playbackId: string | null = null;

    // Helper to create a brand new stream
    const createNewLivepeerStream = async () => {
      console.log('Creating new Livepeer stream for user:', userId);
      const streamResponse = await fetch(`${LIVEPEER_API_URL}/stream`, {
        method: 'POST',
        headers: getLivepeerHeaders(),
        body: JSON.stringify({
          name: `Admin Stream - ${userId.substring(0, 8)}`,
          record, // Respect admin toggle
        }),
      });

      if (!streamResponse.ok) {
        const errorText = await streamResponse.text();
        console.error('Livepeer stream creation failed:', streamResponse.status, errorText);
        throw new Error(`Livepeer stream creation failed: ${streamResponse.statusText} - ${errorText}`);
      }

      const livepeerStream = await streamResponse.json();
      const s = livepeerStream.stream || livepeerStream;
      
      if (!s.id || !s.streamKey) {
         console.error('Invalid Livepeer stream response:', livepeerStream);
         throw new Error('Invalid Livepeer stream response');
      }

      return {
        id: s.id,
        streamKey: s.streamKey,
        rtmpIngestUrl: s.rtmpIngestUrl,
        playbackId: s.playbackId
      };
    };

    if (existingStream && existingStream.livepeer_stream_id) {
      // Reuse existing base stream
      const parentStreamId = existingStream.livepeer_stream_id;
      console.log(`Attempting to reuse existing stream: ${parentStreamId}`);

      try {
        const streamResponse = await fetch(`${LIVEPEER_API_URL}/stream/${parentStreamId}`, {
            method: 'GET',
            headers: getLivepeerHeaders(),
        });

        if (!streamResponse.ok) {
            console.warn(`Parent stream ${parentStreamId} check failed (${streamResponse.status}), creating new stream.`);
             const newStream = await createNewLivepeerStream();
             streamId = newStream.id;
             streamKey = newStream.streamKey;
             rtmpUrl = newStream.rtmpIngestUrl;
             playbackId = newStream.playbackId;
        } else {
            const parentStream = await streamResponse.json();
            // Livepeer API response structure check
            // Based on test script, the root object is the stream
            streamId = parentStream.id;
            streamKey = parentStream.streamKey;
            rtmpUrl = parentStream.rtmpIngestUrl;
            playbackId = parentStream.playbackId;
            
            if (!streamKey) {
                console.warn('Existing stream returned no streamKey (restricted API key?), creating new stream.');
                const newStream = await createNewLivepeerStream();
                streamId = newStream.id;
                streamKey = newStream.streamKey;
                rtmpUrl = newStream.rtmpIngestUrl;
                playbackId = newStream.playbackId;
            } else {
                // Update record flag if needed
                if (typeof parentStream.record === 'boolean' && parentStream.record !== record) {
                  console.log(`Updating Livepeer stream record flag to ${record}`);
                  await fetch(`${LIVEPEER_API_URL}/stream/${parentStreamId}`, {
                    method: 'PATCH',
                    headers: getLivepeerHeaders(),
                    body: JSON.stringify({ record }),
                  }).catch((err) => {
                    console.warn('Failed to update Livepeer record flag (non-blocking):', err);
                  });
                }
                console.log('Successfully reused existing stream credentials');
            }
        }
      } catch (error) {
        console.error('Error checking parent stream, falling back to new stream:', error);
        const newStream = await createNewLivepeerStream();
        streamId = newStream.id;
        streamKey = newStream.streamKey;
        rtmpUrl = newStream.rtmpIngestUrl;
        playbackId = newStream.playbackId;
      }
    } else {
      // No existing stream, create new one
      const newStream = await createNewLivepeerStream();
      streamId = newStream.id;
      streamKey = newStream.streamKey;
      rtmpUrl = newStream.rtmpIngestUrl;
      playbackId = newStream.playbackId;
    }

    // Ensure we have fallback values if something went wrong but didn't throw
    if (!streamId || !streamKey) {
      console.error('Failed to resolve stream credentials, forcing creation of new stream');
      try {
        const newStream = await createNewLivepeerStream();
        streamId = newStream.id;
        streamKey = newStream.streamKey;
        rtmpUrl = newStream.rtmpIngestUrl ?? 'rtmp://rtmp.livepeer.studio/live';
        playbackId = newStream.playbackId;
      } catch (finalError) {
        console.error('Final attempt to create stream failed:', finalError);
        return NextResponse.json(
          { error: 'Failed to obtain valid stream credentials from Livepeer' },
          { status: 500 }
        );
      }
    }
    
    // Final safety check for required fields
    if (!rtmpUrl) {
      // If RTMP URL is missing from response, construct it manually or fallback
      // Standard Livepeer RTMP ingest is consistent
      rtmpUrl = 'rtmp://rtmp.livepeer.studio/live'; 
    }

    // Step 2: Create or Update stream record in Supabase
    let data, error;

    if (existingStream) {
        // Update existing stream record
        console.log(`Updating existing stream record ${existingStream.id}`);
        
        // Construct update object carefully to avoid null constraint violations
        const updatePayload: any = {
            title: title.trim(),
            livepeer_stream_id: streamId, 
            rtmp_ingest_url: rtmpUrl,
            stream_key: streamKey,
            playback_id: playbackId ?? existingStream.playback_id ?? null,
            record_enabled: record,
            price_usd: numericPrice,
            is_free: isFree !== false,
            is_live: true,
            updated_at: new Date().toISOString(),
        };
        
        // Only add optional fields if they have values or if DB allows null
        // Description allows null
        updatePayload.description = description?.trim() || null;

        const updateResult = await supabase
            .from('streams')
            .update(updatePayload)
            .eq('id', existingStream.id)
            .select()
            .single();
            
        data = updateResult.data;
        error = updateResult.error;
    } else {
        // Insert new stream record
        console.log('Inserting new stream record');
        
        const insertPayload = {
            title: title.trim(),
            description: description?.trim() || null,
            livepeer_stream_id: streamId, 
            rtmp_ingest_url: rtmpUrl,
            stream_key: streamKey,
            admin_user_id: userId,
            playback_id: playbackId ?? null,
            record_enabled: record,
            price_usd: numericPrice,
            is_free: isFree !== false,
            is_live: true,
        };
        
        const insertResult = await supabase
            .from('streams')
            .insert(insertPayload)
            .select()
            .single();
            
        data = insertResult.data;
        error = insertResult.error;
    }

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: `Database error: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      streamId: data.id, // Supabase ID
      rtmpUrl,
      streamKey,
      playbackId,
      recordEnabled: record,
      message: 'Stream session ready',
    });

  } catch (error) {
    console.error('Stream creation fatal error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
