
from typing import Union
from fastapi_utils.timing import add_timing_middleware
from fastapi import FastAPI, UploadFile
from lib.ingestion import convert_file_to_llamaindex_nodes, init_vector_store, query_vector_store
from dotenv import load_dotenv
load_dotenv()

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()
add_timing_middleware(app, record=logger.info)

@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_file(file: UploadFile, email: str):
    # store the file locally
    with open(file.filename, "wb") as f:
        content = await file.read()
        f.write(content)
    logger.info(f"File {file.filename} loaded in temp folder successfully")
    nodes = await convert_file_to_llamaindex_nodes(file.filename)
    logger.info(f"File {file.filename} converted to nodes successfully")
    init_vector_store(nodes, email)
    logger.info(f"File {file.filename} stored in chroma successfully")
    return {"filename": file.filename}

@app.post("/rag")
async def rag(prompt: str, email: str):
    resp = await query_vector_store(prompt, email)
    return {
        "response": resp
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)