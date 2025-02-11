- pip install llama-index-utils-workflow
- pip install llama-index
- pip install llama-index-node-parser-docling
- pip install llama-index-readers-docling
- pip install "fastapi[standard]"
- pip install fastapi-utils
- pip install chromadb-client
- pip install llama-index-extractors-entity
- pip install llama-index-llms-gemini llama-index
- pip install rapidocr_onnxruntime
- pip install nltk

Scripts:
- fastapi dev src/main.py
- docker run --name mindfolder-chroma -p 8001:8000 -d chromadb/chroma