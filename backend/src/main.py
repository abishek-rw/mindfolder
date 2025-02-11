from typing import Union
from fastapi_utils.timing import add_timing_middleware
from fastapi import FastAPI, UploadFile
from 

app = FastAPI()

@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/upload")
async def upload_file(file: UploadFile):
    return {"filename": file.filename}