import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import './App.css';
import SearchBar from './components/SearchBar';
import ImageList from './components/ImageList';
import ImagePage from './components/ImagePage';

function AppInner() {
  const [images, setImages] = useState([]);
  const navigate = useNavigate();

  const handleSearch = async (query) => {
    if (!query) return;
    try {
      const response = await fetch(`http://localhost:8000/search/text?q=${encodeURIComponent(query)}&limit=40`);
      const data = await response.json();
      setImages(data.results || []);
      // If user is on an image detail page, navigate back to home to show results
      navigate('/');
      // Scroll to top to focus newly loaded results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Search failed:', e);
    }
  };

  const handleVisualSearch = async (file) => {
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('http://localhost:8000/search/visual/upload?limit=40', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Visual search failed');
      }
      
      const data = await response.json();
      setImages(data.results || []);
      // Navigate back to home to show results
      navigate('/');
      // Scroll to top to focus newly loaded results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Visual search failed:', e);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Pinterest Clone</h1>
        <SearchBar onSearch={handleSearch} onVisualSearch={handleVisualSearch} />
      </header>
      <main>
        <Routes>
          <Route path="/" element={<ImageList images={images} />} />
          <Route path="/images/:id" element={<ImagePage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppInner />
    </Router>
  );
}

export default App;
