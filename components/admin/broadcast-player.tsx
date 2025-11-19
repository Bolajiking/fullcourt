'use client';

import * as Broadcast from '@livepeer/react/broadcast';
import { getIngest } from '@livepeer/react/external';
import { EnableVideoIcon, StopIcon } from '@livepeer/react/assets';

interface BroadcastPlayerProps {
  streamKey: string;
  title?: string;
}

export function BroadcastPlayer({ streamKey, title = "Current livestream" }: BroadcastPlayerProps) {
  if (!streamKey) return null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-900 shadow-lg border border-zinc-800">
      <Broadcast.Root ingestUrl={getIngest(streamKey)}>
        <Broadcast.Container className="h-full w-full bg-zinc-950">
          <Broadcast.Video title={title} className="h-full w-full object-cover" />

          <Broadcast.Controls className="absolute bottom-0 left-0 right-0 flex items-center justify-center p-4 bg-gradient-to-t from-black/80 to-transparent">
            <Broadcast.EnabledTrigger className="group relative flex h-14 w-14 items-center justify-center rounded-full bg-red-600 transition-transform hover:scale-110 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-white/50">
              <Broadcast.EnabledIndicator asChild matcher={false}>
                <EnableVideoIcon className="h-8 w-8 text-white" />
              </Broadcast.EnabledIndicator>
              <Broadcast.EnabledIndicator asChild>
                <StopIcon className="h-8 w-8 text-white animate-pulse" />
              </Broadcast.EnabledIndicator>
            </Broadcast.EnabledTrigger>
          </Broadcast.Controls>

          <Broadcast.LoadingIndicator asChild matcher={false}>
            <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-sm border border-white/10">
              <Broadcast.StatusIndicator
                matcher="live"
                className="flex items-center gap-2"
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">LIVE</span>
              </Broadcast.StatusIndicator>

              <Broadcast.StatusIndicator
                matcher="pending"
                className="flex items-center gap-2"
              >
                <div className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-white">LOADING</span>
              </Broadcast.StatusIndicator>

              <Broadcast.StatusIndicator
                matcher="idle"
                className="flex items-center gap-2"
              >
                <div className="h-2 w-2 rounded-full bg-zinc-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">IDLE</span>
              </Broadcast.StatusIndicator>
            </div>
          </Broadcast.LoadingIndicator>
        </Broadcast.Container>
      </Broadcast.Root>
    </div>
  );
}

