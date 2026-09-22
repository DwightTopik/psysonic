import { useMemo, useState, type ReactNode } from 'react';
import { buildOriginalCoverArtFetchUrl } from './fetchUrl';
import type { CoverArtRef } from './types';

type OriginalCoverArtImageProps = {
  coverRef: CoverArtRef | null | undefined;
  className?: string;
  alt?: string;
  fallback: ReactNode;
};

/** Displays untouched getCoverArt bytes, mounting the static fallback only after failure. */
export function OriginalCoverArtImage({
  coverRef,
  className,
  alt = '',
  fallback,
}: OriginalCoverArtImageProps) {
  const originalSrc = useMemo(
    () => coverRef ? buildOriginalCoverArtFetchUrl(coverRef) : null,
    [coverRef],
  );
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!originalSrc || failedSrc === originalSrc) return fallback;

  return (
    <img
      className={className}
      src={originalSrc}
      alt={alt}
      onError={() => setFailedSrc(originalSrc)}
    />
  );
}
