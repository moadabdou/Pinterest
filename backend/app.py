import uvicorn
import torch
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from qdrant_client import QdrantClient, models
from transformers import AutoProcessor, AutoModel, AutoImageProcessor
from contextlib import asynccontextmanager
from PIL import Image
from io import BytesIO


# --- Configuration ---

QDRANT_PATH = "./qdrant_storage" 
COLLECTION_TEXT = "text_visual_index"
COLLECTION_VISUAL = "pure_visual_index"
SIGLIP_MODEL_NAME = "google/siglip-base-patch16-256"
DINOV2_MODEL_NAME = "facebook/dinov2-large"


ml_models = {}

# --- FastAPI Lifespan Events ---

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- On Startup ---
    print("--- Loading ML Models and DB Client ---")
    

    ml_models["device"] = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Running on device: {ml_models['device']}")
    
    # 2. Load SIGLIP Model (for text search)
    ml_models["siglip_processor"] = AutoProcessor.from_pretrained(SIGLIP_MODEL_NAME)
    ml_models["siglip_model"] = AutoModel.from_pretrained(SIGLIP_MODEL_NAME).to(ml_models["device"])
    print("SIGLIP model loaded.")

    # 3. Load DINOv2 Model (for visual search with uploaded images)
    ml_models["dino_processor"] = AutoImageProcessor.from_pretrained(DINOV2_MODEL_NAME)
    ml_models["dino_model"] = AutoModel.from_pretrained(DINOV2_MODEL_NAME).to(ml_models["device"])
    print("DINOv2 model loaded.")

    # Connect to Qdrant by loading the local storage path
    print(f"Loading Qdrant DB from path: {QDRANT_PATH}")
    try:
        ml_models["qdrant_client"] = QdrantClient(path=QDRANT_PATH)
        
        info_text = ml_models["qdrant_client"].get_collection(COLLECTION_TEXT)
        info_visual = ml_models["qdrant_client"].get_collection(COLLECTION_VISUAL)
        print(f"Found collection '{COLLECTION_TEXT}' with {info_text.points_count} points.")
        print(f"Found collection '{COLLECTION_VISUAL}' with {info_visual.points_count} points.")
        print("--- Qdrant DB loaded successfully. ---")
        
    except Exception as e:
        print(f"--- QDRANT ERROR ---")
        print(f"Could not load Qdrant database from {QDRANT_PATH}.")
        print(f"Error: {e}")

    yield
    
    # --- On Shutdown ---
    print("--- Shutting down ---")
    if "qdrant_client" in ml_models:
        ml_models["qdrant_client"].close()
    ml_models.clear()


# --- Create FastAPI App ---
app = FastAPI(
    title="Multimodal Search API",
    description="API for searching images with text (SIGLIP) and visually (DINOv2).",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows all origins
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods
    allow_headers=["*"], # Allows all headers
)

# --- API Endpoints ---

@app.get("/")
def get_root():
    return {"status": "ok", "message": "Multimodal Search API is running."}

@app.get("/search/text")
async def search_by_text(q: str, limit: int = 10):

    if not q:
        raise HTTPException(status_code=400, detail="Query 'q' is required.")
    
    if "qdrant_client" not in ml_models:
        raise HTTPException(status_code=503, detail="Database not loaded. Check server logs.")
        
    try:
        # 1. Encode text query to SIGLIP vector
        processor = ml_models["siglip_processor"]
        model = ml_models["siglip_model"]
        device = ml_models["device"]
        
        with torch.no_grad():
            inputs = processor(text=[q], padding="max_length", return_tensors="pt").to(device)
            query_vector = model.get_text_features(**inputs).cpu().numpy()[0]
            
        # 2. Search Qdrant
        client = ml_models["qdrant_client"]
        search_results = client.search(
            collection_name=COLLECTION_TEXT,
            query_vector=query_vector,
            limit=limit,
            with_payload=True # Get the URL, description, etc.
        )
        
        return {"query": q, "results": search_results}

    except Exception as e:
        print(f"[ERROR /search/text]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/search/visual/{image_id}")
async def search_by_visual(image_id: int, limit: int = 10):

    if "qdrant_client" not in ml_models:
        raise HTTPException(status_code=503, detail="Database not loaded. Check server logs.")

    try:
        client = ml_models["qdrant_client"]
        
        # 1. Retrieve the query image's DINOv2 vector from the DB
        retrieved_point = client.retrieve(
            collection_name=COLLECTION_VISUAL,
            ids=[image_id],
            with_vectors=True # We *must* get the vector
        )
        
        if not retrieved_point:
            raise HTTPException(status_code=404, detail=f"Image ID {image_id} not found.")
        
        query_vector = retrieved_point[0].vector
        
        # 2. Use that vector to search for other similar vectors
        search_results = client.search(
            collection_name=COLLECTION_VISUAL,
            query_vector=query_vector,
            limit=limit,
            with_payload=True,
            search_params=models.SearchParams(
                hnsw_ef=128, 
                exact=False
            )
        )
        
        # 3. Exclude the query image itself from results
        final_results = [
            r for r in search_results if r.id != image_id
        ]
        
        return {"query_id": image_id, "results": final_results}
        
    except Exception as e:
        print(f"[ERROR /search/visual]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search/visual/upload")
async def search_by_uploaded_image(file: UploadFile = File(...), limit: int = 10):
    """
    Search for visually similar images by uploading an image.
    Uses DINOv2 to encode the uploaded image and find similar images in the database.
    """
    if "qdrant_client" not in ml_models:
        raise HTTPException(status_code=503, detail="Database not loaded. Check server logs.")
    
    if "dino_model" not in ml_models:
        raise HTTPException(status_code=503, detail="DINOv2 model not loaded. Check server logs.")
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")
    
    try:
        # 1. Read and process the uploaded image
        contents = await file.read()
        image = Image.open(BytesIO(contents)).convert("RGB")
        
        # 2. Encode image using DINOv2
        processor = ml_models["dino_processor"]
        model = ml_models["dino_model"]
        device = ml_models["device"]
        
        with torch.no_grad():
            inputs = processor(images=image, return_tensors="pt").to(device)
            outputs = model(**inputs)
            # Use CLS token embedding (first token)
            query_vector = outputs.last_hidden_state[:, 0, :].cpu().numpy()[0]
        
        # 3. Search Qdrant visual collection
        client = ml_models["qdrant_client"]
        search_results = client.search(
            collection_name=COLLECTION_VISUAL,
            query_vector=query_vector,
            limit=limit,
            with_payload=True,
            search_params=models.SearchParams(
                hnsw_ef=128,
                exact=False
            )
        )
        
        return {"query": "uploaded_image", "results": search_results}
        
    except Exception as e:
        print(f"[ERROR /search/visual/upload]: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/image/{image_id}")
async def get_image(image_id: int):
    if "qdrant_client" not in ml_models:
        raise HTTPException(status_code=503, detail="Database not loaded. Check server logs.")
    
    try:
        qdrant_client = ml_models["qdrant_client"]
        
        # Retrieve the point from one of the collections. Let's try the text collection first.
        # You might need a more robust way to know which collection the ID belongs to.
        # Try text collection first; if empty try visual collection
        image_data = qdrant_client.retrieve(
            collection_name=COLLECTION_TEXT,
            ids=[image_id],
            with_payload=True
        )
        if not image_data:
            image_data = qdrant_client.retrieve(
                collection_name=COLLECTION_VISUAL,
                ids=[image_id],
                with_payload=True
            )

        if not image_data:
            raise HTTPException(status_code=404, detail="Image not found.")
            
        return image_data[0]

    except Exception as e:
        print(f"Error retrieving image {image_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving image: {e}")

# --- Main entry point to run the server ---
if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True)