# Data Processing Pipeline

This folder contains Jupyter notebooks designed to be executed on **Google Colab**.

## Purpose
The notebooks in this directory handle the heavy lifting of:
1.  Downloading the raw image dataset (Unsplash Lite).
2.  Generating vector embeddings for images and text using deep learning models:
    *   **SIGLIP**: For semantic text-to-image search.
    *   **DINOv2**: For visual similarity (image-to-image) search.
3.  Indexing these vectors into a **Qdrant** database with two separate collections.

## How to Use
1.  Upload `data_processing_pipeline.ipynb` to Google Colab.
2.  Run the notebook. It will:
    *   Mount your Google Drive.
    *   Process the images through both models.
    *   Save the Qdrant database as a zip file (`qdrant_checkpoint.zip`) to your Google Drive.
3.  **After processing is complete:**
    *   Download the `qdrant_checkpoint.zip` from your Google Drive.
    *   Extract the contents into the `backend/qdrant_storage` folder of this project.
    *   This allows your local backend to serve the search engine using the pre-computed data.

## Note
We use Google Colab to take advantage of free GPU resources, which significantly speeds up the embedding generation process compared to running on a standard CPU.
