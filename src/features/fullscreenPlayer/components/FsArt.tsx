import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Music } from 'lucide-react';
import { useCachedUrl } from '@/ui/CachedImage';
import { OriginalCoverArtImage } from '@/cover/OriginalCoverArtImage';
import type { CoverArtRef } from '@/cover/types';

// Album art box — crossfades layers so old art stays visible while new loads.
// Uses 300px thumbnails (portrait fallback uses 500px separately).
//
// Why onLoad instead of new Image() preload:
//   React batches setLayers(add invisible) + rAF setLayers(make visible) into one
//   commit, so the browser never sees opacity:0 and the CSS transition never fires.
//   Using the DOM img's own onLoad guarantees the element was painted at opacity:0
//   before we flip it to 1.
type FsArtProps = {
  coverRef?: CoverArtRef;
  directCoverArtUrl?: string;
  fetchUrl: string;
  cacheKey: string;
};

type ArtLayer = {
  src: string;
  coverRef?: CoverArtRef;
  directCoverArtUrl?: string;
  id: number;
  vis: boolean;
};

export const FsArt = memo(function FsArt({ coverRef, directCoverArtUrl, fetchUrl, cacheKey }: FsArtProps) {
  // true = show raw fetchUrl immediately as fallback while blob resolves.
  // PlayerBar uses 128px; FS player uses 300px — different cache keys, no warm hit.
  // Showing the URL directly avoids the multi-second blank wait.
  const blobUrl = useCachedUrl(fetchUrl, cacheKey, true);

  const [layers, setLayers] = useState<ArtLayer[]>([]);
  const counter = useRef(0);
  const cleanupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!blobUrl && !coverRef && !directCoverArtUrl) {
      // New track has no cover → drop the old layer so the placeholder shows,
      // instead of leaving the previous track's art on screen.
      setLayers(prev => (prev.length ? [] : prev));
      return;
    }
    const id = ++counter.current;
    setLayers(prev => [...prev, {
      src: blobUrl,
      coverRef,
      directCoverArtUrl,
      id,
      vis: false,
    }]);
  }, [blobUrl, coverRef, directCoverArtUrl]);

  const handleLoad = useCallback((id: number) => {
    if (cleanupTimer.current) clearTimeout(cleanupTimer.current);
    setLayers(prev => prev.map(l => ({ ...l, vis: l.id === id })));
    cleanupTimer.current = setTimeout(() => setLayers(prev => prev.filter(l => l.id === id)), 400);
  }, []);

  if (layers.length === 0) {
    return <div className="fs-art fs-art-placeholder"><Music size={40} /></div>;
  }

  return (
    <>
      {layers.map(l => (
        <div
          key={l.id}
          style={{ opacity: l.vis ? 1 : 0, transition: 'opacity 300ms ease' }}
          onLoadCapture={() => handleLoad(l.id)}
        >
          {l.directCoverArtUrl ? (
            <img className="fs-art" src={l.directCoverArtUrl} alt="" decoding="async" />
          ) : l.coverRef ? (
            <OriginalCoverArtImage
              className="fs-art"
              coverRef={l.coverRef}
              alt=""
              fallback={<img className="fs-art" src={l.src} alt="" decoding="async" />}
            />
          ) : (
            <img className="fs-art" src={l.src} alt="" decoding="async" />
          )}
        </div>
      ))}
    </>
  );
});
