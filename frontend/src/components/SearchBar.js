import React, { useState, useRef } from 'react';

const SearchBar = ({ onSearch, onVisualSearch }) => {
  const [query, setQuery] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsUploading(true);

    try {
      await onVisualSearch(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const clearPreview = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="search-bar">
      <div className="search-input-container">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search for images..."
        />
        <button 
          className="camera-button" 
          onClick={handleCameraClick}
          title="Search with an image"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <button onClick={handleSearch}>Search</button>
      </div>
      
      {previewUrl && (
        <div className="image-preview-container">
          <div className="image-preview">
            <img src={previewUrl} alt="Search preview" />
            <button className="clear-preview" onClick={clearPreview}>×</button>
            {isUploading && <div className="upload-spinner"></div>}
          </div>
          <span className="preview-label">Searching for similar images...</span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
