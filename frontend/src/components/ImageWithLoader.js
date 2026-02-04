import React, { useState, useEffect } from 'react';
import './ImageWithLoader.css';

// Derive a very low-res Unsplash variant for blurred preview
function deriveLowRes(url) {
  try {
    if (!url.includes('images.unsplash.com')) return null;
    const u = new URL(url);
    const params = u.searchParams;
    // Force tiny width & low quality
    params.set('w', '30');
    params.set('q', '10');
    // Prefer format & auto compression if not present
    if (!params.has('fm')) params.set('fm', 'jpg');
    if (!params.has('auto')) params.set('auto', 'format');
    // Remove potential large height constraints
    params.delete('h');
    u.search = params.toString();
    return u.toString();
  } catch (_) {
    return null;
  }
}

const ImageWithLoader = ({ src, alt }) => {
  const [highLoaded, setHighLoaded] = useState(false);
  const [lowLoaded, setLowLoaded] = useState(false);
  const [ratio, setRatio] = useState('3 / 4'); // fallback aspect ratio
  const lowSrc = deriveLowRes(src);

  // Preload high image after low loads (or immediately if no low variant)
  useEffect(() => {
    if (!lowSrc) return;
    if (lowLoaded && !highLoaded) {
      const hi = new Image();
      hi.src = src;
      hi.onload = () => setHighLoaded(true);
    }
  }, [lowLoaded, highLoaded, lowSrc, src]);

  // When low-res loads, capture its natural aspect ratio to stabilize layout
  const handleLowLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.target;
    if (naturalWidth && naturalHeight) {
      setRatio(`${naturalWidth} / ${naturalHeight}`);
    }
    setLowLoaded(true);
  };

  const containerClass = `image-container progressive ${!lowLoaded ? 'loading' : ''}`;
  const showHigh = highLoaded;

  return (
    <div className={containerClass} style={{ aspectRatio: ratio }}>
      {lowSrc && (
        <img
          src={lowSrc}
          alt={alt}
          className={"preview " + (lowLoaded ? 'preview-loaded' : '')}
          onLoad={handleLowLoad}
        />
      )}
      <img
        src={src}
        alt={alt}
        onLoad={() => setHighLoaded(true)}
        className={showHigh ? 'final-image final-visible' : 'final-image'}
      />
    </div>
  );
};

export default ImageWithLoader;
