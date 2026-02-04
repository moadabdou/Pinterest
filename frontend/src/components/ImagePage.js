import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ImageList from './ImageList';
import ImageWithLoader from './ImageWithLoader';

function ImagePage() {
  const { id } = useParams();
  const [image, setImage] = useState(null);
  const [similarImages, setSimilarImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const hiResFromUnsplash = (url) => {
    try {
      if (!url.includes('images.unsplash.com')) return url;
      const u = new URL(url);
      const p = u.searchParams;
      p.set('w', '720');
      p.set('auto', 'format');
      p.set('fit', 'max');
      u.search = p.toString();
      return u.toString();
    } catch (_) {
      return url;
    }
  };

  useEffect(() => {
    const fetchImageAndSimilar = async () => {
      setLoading(true);
      setImage(null);
      setSimilarImages([]);
      try {
        // Fetch the main image details (single retrieval endpoint)
        const imageResponse = await fetch(`http://localhost:8000/image/${id}`);
        if (!imageResponse.ok) {
          throw new Error('Image not found');
        }
        const imageData = await imageResponse.json();
        setImage(imageData);

        // Fetch similar images using visual search (excludes the original)
        const similarResponse = await fetch(`http://localhost:8000/search/visual/${id}?limit=15`);
        if (similarResponse.ok) {
          const similarData = await similarResponse.json();
          setSimilarImages(similarData.results);
        }
      } catch (error) {
        console.error("Failed to fetch image data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImageAndSimilar();
  }, [id]);

  if (loading) {
    return (
      <div className="page-loading-overlay">
        <div className="page-spinner" />
      </div>
    );
  }

  if (!image || !image.payload) {
    return <div style={{padding:'40px', textAlign:'center'}}>Image data could not be loaded.</div>;
  }

  return (
    <div className="image-page">
      <div className="image-detail">
        <div className="image-col">
          <button className="image-zoom-trigger" onClick={() => setShowModal(true)} aria-label="Open full image">
            <ImageWithLoader src={hiResFromUnsplash(image.payload.url)} alt={image.payload.description || 'Image'} />
          </button>
        </div>
        <div className="meta-col">
          <h2 style={{marginTop:0}}>Details</h2>
          <p style={{whiteSpace:'pre-wrap'}}>{image.payload.description || 'No description'}</p>
        </div>
      </div>
      {similarImages.length > 0 && (
        <>
          <h2>Similar Images</h2>
          <ImageList images={similarImages} />
        </>
      )}

      {showModal && (
        <div className="lightbox-overlay" role="dialog" aria-modal="true" onClick={() => setShowModal(false)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" aria-label="Close" onClick={() => setShowModal(false)}>×</button>
            <img src={hiResFromUnsplash(image.payload.url)} alt={image.payload.description || 'Image'} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ImagePage;
