# 📌 Pinterest Clone - Multimodal Image Search Engine

A full-stack Pinterest-style image search application powered by state-of-the-art deep learning models. Search for images using **natural language queries** or find visually similar images by **uploading a photo**.

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=flat&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-2.0+-EE4C2C?style=flat&logo=pytorch&logoColor=white)

## ✨ Features

- **🔤 Text-to-Image Search**: Describe what you're looking for in natural language and find matching images using SIGLIP embeddings
- **📷 Visual Similarity Search**: Upload an image or click on any result to find visually similar images using DINOv2 embeddings
- **⚡ Fast Vector Search**: Powered by Qdrant vector database for efficient similarity search
- **🎨 Pinterest-Style UI**: Responsive masonry grid layout with smooth image loading
- **🖼️ Image Details View**: Click on any image to view details and discover similar images

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   React App     │────▶│   FastAPI       │────▶│   Qdrant DB     │
│   (Frontend)    │     │   (Backend)     │     │   (Vectors)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   ML Models     │
                    │  • SIGLIP       │
                    │  • DINOv2       │
                    └─────────────────┘
```

### Models Used

| Model | Purpose | Description |
|-------|---------|-------------|
| [SIGLIP](https://huggingface.co/google/siglip-base-patch16-256) | Text-to-Image Search | Google's vision-language model for semantic text-image matching |
| [DINOv2](https://huggingface.co/facebook/dinov2-large) | Visual Similarity | Meta's self-supervised vision model for image feature extraction |

## 📁 Project Structure

```
Pinterest/
├── backend/                 # FastAPI backend server
│   ├── app.py              # Main API endpoints
│   ├── requirements.txt    # Python dependencies
│   └── qdrant_storage/     # Vector database storage
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── App.js          # Main application component
│   │   └── components/     # React components
│   └── package.json        # Node.js dependencies
├── processing/             # Data processing pipeline
│   ├── data_processing_pipeline.ipynb  # Colab notebook for embedding generation
│   └── README.md           # Processing instructions
└── assets/                 # Documentation assets
```

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- Node.js 16+
- CUDA-compatible GPU (recommended for faster inference)

### 1. Clone the Repository

```bash
git clone https://github.com/moadabdou/Pinterest_clone.git
cd Pinterest_clone
```

### 2. Set Up the Backend

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows
.\venv\Scripts\activate
# Linux/macOS
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Set Up the Frontend

```bash
cd frontend

# Install dependencies
npm install
```

### 4. Prepare the Vector Database

**Option A: Download Pre-computed Embeddings (Recommended)**

The vector database files are too large for GitHub. Download them from Google Drive:

1. Go to [📁 Google Drive - Qdrant Collection Files](https://drive.google.com/drive/folders/1qsFZbZKa5F7GLTpWWsJlcAj5zJcpUTfq?usp=sharing)
2. Download the collection folder contents
3. Place the downloaded files in `backend/qdrant_storage/collection/`

**Option B: Generate Embeddings Yourself**

If you prefer to generate embeddings from scratch using Google Colab (for free GPU access):

1. Upload `processing/data_processing_pipeline.ipynb` to Google Colab
2. Run all cells to process images and generate embeddings
3. Download the resulting `qdrant_checkpoint.zip`
4. Extract contents to `backend/qdrant_storage/`

See [`processing/README.md`](processing/README.md) for detailed instructions.

### 5. Run the Application

**Start the Backend:**
```bash
cd backend
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

**Start the Frontend (in a new terminal):**
```bash
cd frontend
npm start
```

The application will be available at `http://localhost:3000`

## 🔌 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/search/text?q={query}&limit={n}` | GET | Search images by text query |
| `/search/visual/{image_id}?limit={n}` | GET | Find similar images by ID |
| `/search/visual/upload?limit={n}` | POST | Find similar images by uploading an image |
| `/image/{image_id}` | GET | Get image details by ID |

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PyTorch** - Deep learning framework
- **Transformers** - Hugging Face model hub
- **Qdrant** - Vector similarity search engine
- **Uvicorn** - ASGI server

### Frontend
- **React 18** - UI library
- **React Router** - Client-side routing
- **CSS3** - Styling with custom animations

### ML/AI
- **SIGLIP** - Vision-language model for semantic search
- **DINOv2** - Self-supervised vision transformer

## 📸 Dataset

This project uses the [Unsplash Lite Dataset](https://unsplash.com/data), which contains 25,000+ high-quality images with metadata.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Unsplash](https://unsplash.com/) for the image dataset
- [Google Research](https://github.com/google-research/big_vision) for SIGLIP
- [Meta AI](https://github.com/facebookresearch/dinov2) for DINOv2
- [Qdrant](https://qdrant.tech/) for the vector database

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/moadabdou">moadabdou</a>
</p>
