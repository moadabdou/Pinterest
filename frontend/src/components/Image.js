import React from 'react';
import { Link } from 'react-router-dom';
import ImageWithLoader from './ImageWithLoader';

function adjustUnsplash(url) {
  if (!url || !url.includes('images.unsplash.com')) return url;
  try {
    const u = new URL(url);
    const params = u.searchParams;
    // Constrain width for grid thumbnails for lighter payload
    params.set('w', '300');
    params.set('auto', 'format');
    params.set('fit', 'max');
    u.search = params.toString();
    return u.toString();
  } catch (_) {
    return url;
  }
}

const Image = ({ image }) => {
  const thumbUrl = adjustUnsplash(image.payload.url);
  return (
    <div className="image-item">
      <Link to={`/images/${image.id}`}>
        <ImageWithLoader src={thumbUrl} alt={image.payload.description || 'Image'} />
      </Link>
    </div>
  );
};

export default Image;
