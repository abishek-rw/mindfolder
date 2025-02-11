from ollama import Client
import os
from fastapi import FastAPI, HTTPException, Form, UploadFile, File
import tempfile
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta, datetime
from typing import List, Dict, Optional, Tuple, Callable
import re
from pydantic import BaseModel
from azure.storage.blob import BlobServiceClient, generate_blob_sas, BlobSasPermissions
import uvicorn
import logging
from dotenv import load_dotenv
from docx import Document
import os
from sentence_transformers import SentenceTransformer
import numpy as np
import logging
from typing import List, Dict
import pandas as pd
from docling.document_converter import DocumentConverter, PdfFormatOption, WordFormatOption, ExcelFormatOption
from docling.datamodel.pipeline_options import (
    PdfPipelineOptions,
    TableFormerMode,
    AcceleratorDevice,
    AcceleratorOptions,
    RapidOcrOptions,
)
from docling.datamodel.base_models import InputFormat
from docling.backend import pypdfium2_backend
import chromadb
import uvicorn
from transformers import pipeline
from pathlib import Path
import logging
from pydantic import BaseModel, EmailStr
from auth import check_user, register_user, generate_otp, verify_otp, resend_otp
from functions import sort_files, filter_files, search_files, group_files
import json
from docling_core.transforms.chunker.hybrid_chunker import HybridChunker
from docling.pipeline.simple_pipeline import SimplePipeline
from google.generativeai import GenerativeModel
import google.generativeai as genai


load_dotenv()

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  
    allow_credentials=True,
    allow_methods=["*"],  
    allow_headers=["*"],  
)

embedder = SentenceTransformer("all-MiniLM-L12-v2", device = 'cpu')

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

name = pipeline(
    "ner",
    model="FacebookAI/xlm-roberta-large-finetuned-conll03-english",
    aggregation_strategy="average",
)

# Azure Blob Storage setup
connection_string = os.getenv("CONNECTION_STRING")
container_name = os.getenv("CONTAINER_NAME")
gemini_api = os.getenv("GEMINI_API_KEY")
blob_service_client = BlobServiceClient.from_connection_string(connection_string)
sas_token = os.getenv("SAS_TOKEN")

print("GMMA")
# ChromaDB setup
chroma_client = chromadb.PersistentClient(path="chroma_data")
collection = chroma_client.get_or_create_collection(
    name="mindfolder",
    metadata={"hnsw:space": "cosine"}
)

SIMILARITY_THRESHOLD = 0.5  



class QueryRequest(BaseModel):
    user_email: str
    user_prompt: str
    folder_name: Optional[str] = None  
    max_chunks: Optional[int] = 10

class ProcessRequest(BaseModel):
    prompt: str
    user_email: str
    folder: Optional[str] = None


class SignupRequest(BaseModel):
    email: EmailStr
    name: str


class LoginRequest(BaseModel):
    email: EmailStr


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str
    document_id: str


class OTPUseRequest(BaseModel):
    email: EmailStr
    otp: str
    document_id: str

def scrape_file(file_path):
    try:
        ocr_options = RapidOcrOptions()
        pipeline_options = PdfPipelineOptions(do_table_structure=True, do_ocr=True)
        pipeline_options.ocr_options = ocr_options
        pipeline_options.ocr_options.lang = ["en"]
        pipeline_options.accelerator_options = AcceleratorOptions(
            num_threads=4, device=AcceleratorDevice.CUDA
        )
        pipeline_options.table_structure_options.do_cell_matching = False
        pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE

        pipeline_options.create_legacy_output = True

        converter = DocumentConverter(
            allowed_formats=[
                InputFormat.PDF,
                InputFormat.IMAGE,
                InputFormat.DOCX,
                InputFormat.HTML,
                InputFormat.PPTX,
                InputFormat.ASCIIDOC,
                InputFormat.MD,
                InputFormat.XLSX,
            ],
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=pipeline_options,
                    backend=pypdfium2_backend.PyPdfiumDocumentBackend,
                ),
                InputFormat.DOCX: WordFormatOption(
                    pipeline_cls=SimplePipeline  
                ),
                InputFormat.XLSX: ExcelFormatOption(
                    pipeline_cls=SimplePipeline
                ),
            }
        )
        doc = converter.convert(source=file_path).document
        print("Processed")
        return doc
    except Exception as e:
        return e
    
def handle_csv_file(file_path: str) -> str:
    try:
        # Read CSV file
        df = pd.read_csv(file_path)
        
        # Create temporary file with xlsx extension
        temp_xlsx = tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False)
        xlsx_path = temp_xlsx.name
        temp_xlsx.close()
        
        # Convert to Excel
        df.to_excel(xlsx_path, index=False)
        return xlsx_path
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error converting CSV file: {str(e)}")


def chunk_text(text):
    chunkys = []
    chunker = HybridChunker()
    chunk_iter = chunker.chunk(text)
    for chunk in chunk_iter:
        chunkys.append(chunker.serialize(chunk=chunk))
    return chunkys

def read_file(file_path: str) -> str:
    print(file_path)
    if not file_path:
        raise HTTPException(status_code=400, detail="No file provided")
        
    file_extension = os.path.splitext(file_path)[1].lower()
    
    try:
        if file_extension == '.csv':
            # Convert CSV to XLSX and get new path
            xlsx_path = handle_csv_file(file_path)
            try:
                # Process the XLSX file
                return scrape_file(xlsx_path)
            finally:
                # Clean up temporary XLSX file
                if os.path.exists(xlsx_path):
                    os.unlink(xlsx_path)
        else:
            return scrape_file(file_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

    

def generate_embeddings(chunks: List[str]) -> np.ndarray:
    embeddings = embedder.encode(chunks, convert_to_tensor=True)
    print("EMBEDDED")
    return embeddings.cpu().numpy().astype("float32")

async def save_upload_to_temp(file: UploadFile) -> str:
    # Get the file extension from the original filename
    file_extension = Path(file.filename).suffix
    
    # Create a temporary file with the correct extension
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
        content = await file.read()
        temp_file.write(content)
        return temp_file.name

async def process_file(file_path: str) -> tuple[List[str], np.ndarray]:
    # Read file content using the provided functions
    text = read_file(file_path)
    
    # Chunk the text
    chunks = chunk_text(text)
    
    # Generate embeddings
    embeddings = generate_embeddings(chunks)
    
    return chunks, embeddings

def get_average_embedding(embeddings: np.ndarray) -> np.ndarray:
    """Calculate average embedding for a file"""
    return np.mean(embeddings, axis=0)

async def find_similar_folder(avg_embedding: np.ndarray, user_email: str) -> tuple[bool, str]:
    try:
        """Find if there's a similar folder for the file"""
        # Query existing folders for this user
        results = collection.query(
            query_embeddings=[avg_embedding.tolist()],
            where={
                "$and": [
                    {"user_email": {"$eq": user_email}},
                    {"is_folder_embedding": {"$eq": True}}
                ]
            },
            n_results=1
        )
        
        # Check if we have any results
        if (not results['distances'] or 
            len(results['distances']) == 0 or 
            len(results['metadatas']) == 0 or 
            not results['metadatas'][0]):
            logger.info(f"No similar folders found for user {user_email}")
            return False, ""
        
        similarity = 1 - results['distances'][0][0]  
        if similarity >= SIMILARITY_THRESHOLD:
            folder_name = results['metadatas'][0][0].get('folder_name', '')
            logger.info(f"Found similar folder: {folder_name} with similarity: {similarity}")
            return True, folder_name
        
        logger.info(f"No folders met similarity threshold. Best match: {similarity}")
        return False, ""
        
    except Exception as e:
        logger.error(f"Error in find_similar_folder: {str(e)}")
        return False, ""

def store_in_chromadb(
    collection,
    all_chunks: List[str],
    embeddings: np.ndarray,
    file_to_cluster: Dict[str, str],
    cluster_names: Dict[str, str],
    file_chunk_indices: Dict[str, List[int]],
    user_email: str,
    folder_name: str,
    file_info: Dict[str, Dict]
):
    """
    Store all chunks with their file's cluster and folder metadata.
    File sizes are stored with their units (e.g., "1.2 MB").
    Only one date (either created_date or modified_date) is stored.
    """
    for file_name, chunk_indices in file_chunk_indices.items():
        # Get file metadata
        file_metadata = file_info.get(file_name, {})
        
        # Clean file type by removing the leading dot
        file_type = file_metadata.get("file_type", "").lstrip('.')
        
        # Extract size with unit
        file_size_with_unit = file_metadata.get("size", "0 KB")  # Default to "0 KB"
        if isinstance(file_size_with_unit, str):  # Handle size as a string (e.g., "1.2 MB")
            try:
                size_str, unit = file_size_with_unit.split()
                size = float(size_str)
                # Normalize to bytes internally for consistency
                if unit == "GB":
                    size_in_bytes = size * 1024**3
                elif unit == "MB":
                    size_in_bytes = size * 1024**2
                else:  # KB
                    size_in_bytes = size * 1024
            except (ValueError, AttributeError):
                size_in_bytes = 0  # Default to 0 if parsing fails
        else:
            size_in_bytes = 0
        
        # Use either created_date or modified_date, preferring created_date if available
        file_date = file_metadata.get("created_date") or file_metadata.get("modified_date", "")
        
        for chunk_idx in chunk_indices:
            chunk_text = all_chunks[chunk_idx]
            chunk_embed = embeddings[chunk_idx].tolist()
            document_id = f"{user_email}_{file_name}_{chunk_idx}"
            
            # Add the chunk to the ChromaDB collection
            collection.add(
                documents=[chunk_text],
                metadatas=[{
                    "user_email": user_email,
                    "folder_name": folder_name,
                    "original_file": file_name,
                    "chunk_index": chunk_idx,
                    "file_size_with_unit": file_size_with_unit,     
                    "file_size_in_bytes": size_in_bytes,         
                    "file_date": file_date,                      
                    "file_type": file_type                       
                }],
                embeddings=[chunk_embed],
                ids=[document_id]
            )
    
    return collection

# def assign_using_llm(text: str) -> str:
#     try:
#         ollama_client = Client(host="http://localhost:11434")
        
#         try:
#             ollama_client.pull("mistral-small")
#             logger.debug("Pulled model")
#         except Exception as e:
#             print(f"Model pull warning: {e}")
        
        
            
#         formatted_prompt = f"""
#         Based on the context of similar files from my desktop file manager, suggest an appropriate generic name for the folder where these files should be placed. Make sure the file name is generic without getting into details.
#         {text}
        
#         Respond only in the following formar:
#         Rationale: [Brief concise reasoning]
#         Final Folder Name: [Folder Name]
#         Final Folder name rationale: [Brief concise reasoning for folder name]
#         """
            
#         response = ollama_client.generate(model="mistral-small", prompt=formatted_prompt,
#             options={
#                 "temperature": 0.1,
#             },)
#         print("RES: ", response['response'])
#         try:
#             return response['response'].replace("*", "").split("Final Folder Name:")[1].split("\n")[0].strip()
#         except:
#             try:
#                 return response['response'].replace("*", "").split("\n")[1].strip()
#             except:
#                 return response['response'].replace("*", "")
    
#     except Exception as e:
#         return str(e)

def assign_using_llm(text: str) -> str:
    try:
        # Initialize the Gemini API
        genai.configure(api_key=gemini_api)
        
        # Initialize the model
        model = GenerativeModel('gemini-1.5-flash-002')
        
        formatted_prompt = f"""
        Based on the context of similar files from my desktop file manager, suggest an appropriate generic name for the folder where these files should be placed. Make sure the file name is generic without getting into details.
        {text}
        
        Respond only in the following format:
        Rationale: [Brief concise reasoning]
        Final Folder Name: [Folder Name]
        Final Folder name rationale: [Brief concise reasoning for folder name]
        """
        
        # Generate response
        response = model.generate_content(
            formatted_prompt,
            generation_config={
                'temperature': 0.1,
            }
        )
        
        response_text = response.text
        print("RES: ", response_text)
        
        # Try to extract the folder name using the same parsing logic
        try:
            return response_text.replace("*", "").split("Final Folder Name:")[1].split("\n")[0].strip()
        except:
            try:
                return response_text.replace("*", "").split("\n")[1].strip()
            except:
                return response_text.replace("*", "")
    
    except Exception as e:
        return str(e)

def process_with_llm(text: str, prompt: str) -> str:
    try:
        # Initialize the Gemini API 
        genai.configure(api_key=gemini_api)
        
        # Initialize the model
        model = GenerativeModel('gemini-1.5-flash-002')
        
        formatted_prompt = f"""
        Based on the following text, answer the user's question:
        {text}
        
        User Question: {prompt}
        
        DO not hallucinate.
        """
        
        # Log the prompt for debugging
        with open("debug.log", "w") as f:
            f.write(formatted_prompt)
            
        # Generate response
        response = model.generate_content(
            formatted_prompt,
            generation_config={
                'temperature': 0.1,
            }
        )
        
        return response.text
        
    except Exception as e:
        return str(e)
    
# def process_with_llm(text: str, prompt: str) -> str:
#     try:
#         ollama_client = Client(host="http://localhost:11435")

#         try:
#             ollama_client.pull("mistral-nemo:12b-instruct-2407-q4_1")
#             logger.debug("Pulled model")
#         except Exception as e:
#             print(f"Model pull warning: {e}")

#         formatted_prompt = f"""
#         Based on the following text, answer the user's question:
#         {text}
        
#         User Question: {prompt}
        
#         DO not hallucinate. 
#         """

#         with open("debug.log", "w") as f:
#             f.write(formatted_prompt)

#         response = ollama_client.generate(
#             model="mistral-nemo:12b-instruct-2407-q4_1",
#             prompt=formatted_prompt,
#             options={
#                 "temperature": 0.1,
#             },
#         )
#         return response

#     except Exception as e:
#         return str(e)
    
def query_clusters(
    user_email: str, 
    user_prompt: str, 
    cluster_name: Optional[str] = None,
    max_chunks: int = 10  
):
    print("QUERY CLUSTERS CALLED")
    print(user_email)
    print(user_prompt)
    print(cluster_name)
    print(max_chunks)
    try:
        # Define the query filter
        if cluster_name is None:
            where_clause = {
                "user_email": {"$eq": user_email}
            }
        else:
            # Use $and operator only when we have multiple conditions
            where_clause = {
                "$and": [
                    {"user_email": {"$eq": user_email}},
                    {"folder_name": {"$eq": cluster_name}}
                ]
            }
        
        print(where_clause)
        
        # Query ChromaDB for relevant chunks
        results = collection.query(
            query_texts=[user_prompt],
            where=where_clause,
            n_results=max_chunks,  
            include=["metadatas", "documents"]
        )
        print(results)
        
        if not results or not results["documents"]:
            raise HTTPException(
                status_code=404,
                detail=f"No documents found for user {user_email} and cluster {cluster_name}"
            )
        
        flattened_documents = [doc for sublist in results["documents"] for doc in sublist]
        
        # Concatenate the most relevant chunks
        concatenated_text = " ".join(flattened_documents[:max_chunks])
        print("concatenated text: ", concatenated_text)
        
        # Generate a response using the LLM
        llm_response = process_with_llm(concatenated_text, user_prompt)
        
        return {
            "user_email": user_email,
            "cluster_id": cluster_name,
            "response": llm_response,
            "chunks_used": len(results["documents"][:max_chunks]),
            "total_chunks_available": len(results["documents"])
        }
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing request: {str(e)}"
        )
        

def get_files(user_email: str, folder_name: Optional[str] = None) -> List[Dict]:
    """
    Retrieve files based on user_email and optional folder_name.
    Use the consolidated 'file_date' field instead of separate 'created_date' and 'modified_date'.
    """
    try:
        # Build the query clause
        where_clause = {
            "user_email": {"$eq": user_email}
        }
        if folder_name:
            where_clause = {
                "$and": [
                    {"user_email": {"$eq": user_email}},
                    {"folder_name": {"$eq": folder_name}}
                ]
            }
        
        # Query the ChromaDB collection
        results = collection.get(
            where=where_clause,
            include=["metadatas"]
        )
        
        # Handle empty results
        if not results or not results.get("metadatas"):
            return []
        
        # Deduplicate files by their original_file name
        unique_files = {}
        for metadata in results["metadatas"]:
            if "original_file" in metadata:
                file_name = metadata["original_file"]
                if file_name not in unique_files:
                    unique_files[file_name] = {
                        "file_name": file_name,
                        "folder_name": metadata.get("folder_name", ""),
                        "user_email": metadata.get("user_email", ""),
                        "size": metadata.get("file_size", 0),
                        "file_date": metadata.get("file_date", ""),  
                        "file_type": metadata.get("file_type", "")
                    }
        
        # Return the list of unique files
        return list(unique_files.values())
    except Exception as e:
        logger.error(f"Error in get_files: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving files: {str(e)}"
        )
        
def parse_query(files: List[Dict], query: str, user_email: str, folder_name: Optional[str] = None):
    try:        
        print("QUERY: ", query)
        # ollama_client = Client(host="http://localhost:11434")
        # ollama_client.pull("mistral-nemo:12b-instruct-2407-q4_1")
        # logger.debug("Pulled model")
        genai.configure(api_key=gemini_api)
        
        # Initialize the model
        model = GenerativeModel('gemini-1.5-flash-002')
        system_prompt = f"""
        Convert the user's file organization query into a series of file operation instructions.
        For the following task, make plans that can solve the problem step by step. For each plan, indicate which external tool together with tool input to retrieve evidence. You can store the evidence into a variable #E that can be called by later tools. (Plan, #E1, Plan, #E2, Plan, ...)
        
        Only use the tools that you absolutely need to. If no tool is relevant for the task, use the `query_cluster` tool as a fallback. When using the `query_cluster` tool, always pass the user's original query as the `user_prompt` parameter.

        You have access to the following tools:
        [
                {{
                    "type": "function",
                    "function": {{
                        "name": "sort_files",
                        "description": "Sort files based on size, date, or name",
                        "parameters": {{
                            "type": "list",
                            "properties": {{
                                "sort_by": {{
                                    "description": "The property to sort by",
                                    "enum": ["size", "date", "name"],
                                    "type": "string",
                                }},
                                "reverse": {{
                                    "description": "Sort in reverse order",
                                    "type": "boolean",
                                }},
                            }},
                            "required": ["sort_by"],
                        }},
                    }},
                }},
                {{
                    "type": "function",
                    "function": {{
                        "name": "filter_files",
                        "description": "Filter files based on size, date, or file type",
                        "parameters": {{
                            "type": "object",
                            "properties": {{
                                "min_size": {{"type": "number"}},
                                "max_size": {{"type": "number"}},
                                "date_after": {{
                                    "description": "Filter files created after this date, in the format 'YYYY-MM-DD'",
                                    "type": "string",
                                }},
                                "date_before": {{
                                    "type": "string",
                                    "description": "Filter files created before this date, in the format 'YYYY-MM-DD'",
                                }},
                                "file_types": {{
                                    "type": "array",
                                    "items": {{"type": "string"}},
                                }},
                            }},
                        }},
                    }},
                }},
                {{
                    "type": "function",
                    "function": {{
                        "name": "group_files",
                        "description": "Group files by type or size range or date(inclusive)",
                        "parameters": {{
                            "type": "object",
                            "properties": {{
                                "group_by": {{
                                    "description": "The property to group by",
                                    "type": "string",
                                    "enum": [
                                        "type",
                                        "size_range",
                                        "date",
                                        "month",
                                        "year",
                                    ],
                                }},
                            }},
                            "required": ["group_by"],
                        }},
                    }},
                }},
                {{
                    "type": "function",
                    "function": {{
                        "name": "search_files",
                        "description": "Search files by name. Use this tool **only if the user explicitly wants to find a file or specifically requests files**.",
                        "parameters": {{
                            "type": "object",
                            "properties": {{
                                "query": {{"type": "string"}},
                            }},
                            "required": ["query"],
                        }},
                    }},
                }},
                {{
                    "type": "function",
                    "function": {{
                        "name": "query_cluster",
                        "description": "Query clustered files based on user prompt and optional cluster name. Use this tool as a fallback when no other tool is relevant. Always pass the user's original query as the `user_prompt` parameter.",
                        "parameters": {{
                            "type": "object",
                            "properties": {{
                                "user_email": {{
                                    "type": "string",
                                    "description": "The email of the user whose files are being queried. The user email is: {user_email}",
                                }},
                                "user_prompt": {{
                                    "type": "string",
                                    "description": "The user's query or prompt",
                                }},
                                "cluster_name": {{
                                    "type": "string",
                                    "description": "Optional cluster name to filter results",
                                }},
                                "max_chunks": {{
                                    "type": "integer",
                                    "description": "Maximum number of chunks to process (default: 10)",
                                }},
                            }},
                            "required": ["user_email", "user_prompt"],
                        }},
                    }},                    
                }}
            ]
            
        Examples:
        Example 1:
        Task: Group all files by months in 2023
        Plan: Filter all files by the year 2023. #E1 = filter_files[{{"date_after": "2023-01-01", "date_before": "2023-12-31"}}]
        Plan: Group remaining files by months. #E2 = group_files[{{"group_by":"month"}}]
        
        Example 2:
        Task: Give all the files
        Plan: No plan required. #E1 = filter_files[{{}}]
        
        Example 3:
        Task: Group by months
        Plan: Group all files from every year by months. #E1 = group_files[{{"group_by":"month"}}]
        
        Example 4:
        Task: Group files by different months in 2024.
        Plan: Filter all files created in the year 2024. #E1 = filter_files[{{"date_after": "2024-01-01", "date_before": "2024-12-31"}}]
        Plan: Group remaining files by months. #E2 = group_files[{{"group_by":"month"}}]
        
        Example 5:
        Task: When is my ticket for the concert?
        Plan: Query the clustered files based on the user prompt. #E1 = query_cluster[{{"user_email": "{user_email}", "user_prompt": "When is my ticket for the concert?"}}]
        
        Example 6: 
        Task: Help me find my ticket.
        Plan: Search for the ticket. #E1 = search_files[{{"query": "ticket"}}]
        
        Example 7:
        Task: What is the summary of my project documents?
        Plan: No relevant tool found. Use query_cluster as a fallback. #E1 = query_cluster[{{"user_email": "{user_email}", "user_prompt": "What is the summary of my project documents?"}}]
        
        Example 8:
        Task: What are the person's skills?
        Plan: Query files for the person's skills. #E1: query_cluster[{{"user_email": "{user_email}", "user_prompt": "What are the person's skills?"}}]
        
        Example 9:
        Task: When is my ticket?
        Plan: Query files for the ticket date. #E1: query_cluster[{{"user_email": "{user_email}", "user_prompt": "When is my ticket?"}}]
        
        Today's date is: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}
        """

    #     messages = [
    #         {"role": "system", "content": system_prompt},
    #         {"role": "user", "content": query},
    #     ]

    #     response = ollama_client.chat(
    #         model="mistral-nemo:12b-instruct-2407-q4_1",
    #         messages=messages,
    #         options={"temperature": 0.1},
    #     )

    #     response_text = response["message"]["content"]
    #     print("RAW RESP: ", response_text)
        
    #     print("Files before filtering:", files)
        
    #     return execute_plans(
    #         response["message"]["content"],
    #         files,
    #         {
    #             "sort_files": sort_files,
    #             "filter_files": filter_files,
    #             "search_files": search_files,
    #             "group_files": group_files,
    #             "query_cluster": query_clusters,
    #         },
    #     )

    # except Exception as e:
    #     print(f"Error parsing query: {e}")
    #     return e
    
        def create_query_cluster_function(query_clusters, folder_name):
            """
            Creates a function that invokes query_clusters with a specific folder_name
            and supports additional parameters via destructuring.

            :param folder_name: The name of the folder to be passed to query_clusters.
            :return: A function that, when called, invokes query_clusters with folder_name
                    and any additional arguments provided.
            """
            def query_cluster_wrapper(*args, **kwargs):
                # Call query_clusters with folder_name and any additional arguments
                kwargs.pop('cluster_name', None)  # Remove 'cluster_name' if it exists in kwargs
                return query_clusters(cluster_name=folder_name, *args, **kwargs)
            
            return query_cluster_wrapper
    
     # Format the messages for Gemini
        prompt = f"""
        System: {system_prompt}
        User: {query}
        Assistant: """

        # Generate response
        response = model.generate_content(
            prompt,
            generation_config={
                'temperature': 0.1,
            }
        )

        response_text = response.text
        print("RAW RESP: ", response_text)
        
        print("Files before filtering:", files)
        
        return execute_plans(
            response_text,
            files,
            {
                "sort_files": sort_files,
                "filter_files": filter_files,
                "search_files": search_files,
                "group_files": group_files,
                "query_cluster": query_clusters
            },
            folder_name=folder_name,
            user_email=user_email
        )

    except Exception as e:
        print(f"Error parsing query: {e}")
        return e

def execute_plans(
    plan_text: str, 
    files: List[Dict], 
    available_functions: Dict[str, Callable],
    folder_name: Optional[str] = None,
    user_email: Optional[str] = None
):
    # Split the text into individual plans
    plans = plan_text.strip().split("\n")
    evidence = {}
    files_rem = files
    # Regular expression to extract evidence ID and function call
    evidence_pattern = r"#(E\d+)\s*=\s*(\w+)\[(.*)\]"
    
    for plan in plans:
        # Skip empty plans
        if not plan.strip():
            continue
        # Find the evidence assignment in the plan
        match = re.search(evidence_pattern, plan)
        if not match:
            continue
            
        evidence_id, function_name, params_str = match.groups()
        print(f"Executing {function_name} with params: {params_str}")  
        
        try:
            # Clean up the parameters string and parse as JSON
            params_str = params_str.strip()
            params = json.loads(params_str)
            
            # Check if function exists
            if function_name not in available_functions:
                raise ValueError(f"Unknown function: {function_name}")
                
            # Execute the function with the parameters
            function = available_functions[function_name]
            if function_name == "query_cluster":
                # Add folder_name as cluster_name to params if it exists
                if folder_name:
                    params["cluster_name"] = folder_name
                # Add user_email if not already in params
                if user_email and "user_email" not in params:
                    params["user_email"] = user_email
                # Execute query_cluster with updated params
                result = function(**params)
            else:
                result = function(files_rem, **params)
                # Handle result based on function
                if isinstance(result, dict) and "filtered_files" in result:
                    files_rem = result["filtered_files"]
                else:
                    files_rem = result
                    
            # Store the evidence for potential future use
            evidence[evidence_id] = result
            print(f"Result for {evidence_id}: {result}")
            
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON parameters in plan: {params_str}")
        except Exception as e:
            raise Exception(
                f"Error executing plan with function {function_name}: {str(e)}"
            )
            
    # Return the last evidence value if any plans were executed
    if evidence:
        last_result = evidence[max(evidence.keys())]
        # If the last result is a dictionary with filtered_files, return that
        if isinstance(result, dict) and "filtered_files" in last_result:
            return {
                "files": last_result["filtered_files"],
                "total_files": last_result["total_files"]
            }
        return last_result
    return None

def folder_size(user_email):
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    # list the blobs in the container
    user_prefix = f"{user_email}/"
    blob_list = container_client.list_blobs(name_starts_with=user_prefix)
    total_size = 0
    for blob in blob_list:
        # get the last modified date and size of the blob
        blob_client = container_client.get_blob_client(blob.name)
        properties = blob_client.get_blob_properties()
        print("Properties: ", properties)
        size = properties.size
        print(f"Name: {blob.name}, Size: {str(size)}")
        total_size += size
    print(f"Total size: {total_size}")
    total_size = total_size / 1000000
    # return size in MB
    total_size = f"{total_size:.2f} MB"
    return total_size

# Optional health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/signup")
def signup_route(request: SignupRequest):
    email = request.email
    name = request.name

    if check_user(email):
        return {"message": "User already exists"}

    user_document_id = register_user(email, name)
    otp = generate_otp(email, name)


    return {"otp_document_id": otp[0], "otp": otp[1]}


@app.post("/login")
def login_route(request: LoginRequest):
    email = request.email

    name = check_user(email)
    if not name:
        return {"message": "User not found, please sign up"}
    print("User found: ", name)

    otp_document_id, otp = generate_otp(email, name)

    return {"otp_document_id": otp_document_id, "otp": otp, "name": name}


@app.post("/verify-otp")
def verify_otp_route(request: OTPVerifyRequest):
    email = request.email
    otp = request.otp
    otp_document_id = request.document_id

    if verify_otp(email, otp, otp_document_id):
        return {"message": "OTP verified successfully"}
    return {"message": "Failed to verify OTP"}


@app.post("/resend-otp")
def resend_otp_route(document_id: str, email: str, name: str):
    return resend_otp(email, name, document_id)

@app.post("/upload")
async def upload_file(
    email: str = Form(...),
    file: UploadFile = File(...)
):
    temp_path = None
    xlsx_path = None
    try:
        logger.info(f"Processing upload for email: {email}, file: {file.filename}")
        
        # Save uploaded file temporarily with correct extension
        temp_path = await save_upload_to_temp(file)
        print("TEMP FILE SAVED")
        
        # Get file metadata
        file_stats = os.stat(temp_path)
        file_info = {
            file.filename: {
                "size": file_stats.st_size,
                "created_date": datetime.fromtimestamp(file_stats.st_ctime).strftime("%Y-%m-%d"),
                "modified_date": datetime.fromtimestamp(file_stats.st_mtime).strftime("%Y-%m-%d"),
                "file_type": os.path.splitext(file.filename)[1].lower().lstrip('.')
            }
        }
        print("FILE STATS: ", file_stats)
        print("FILE INFO: ", file_info)
        
        # Process the file
        chunks, embeddings = await process_file(temp_path)
        print("CHUNKED")
        avg_embedding = get_average_embedding(embeddings)
        print("AVG EMBEDDINGS FOUND")
        
        # Check for similar folders
        has_similar, folder_name = await find_similar_folder(avg_embedding, email)
        print("SIMILAR FOLDERS FOUND")
        
        if not has_similar:
            # Get folder name using LLM
            sample_text = "\n".join(chunks[:3])  # Use first few chunks for context
            folder_name = assign_using_llm(sample_text)
            folder_name = folder_name.split("Deduced Topic: ")[-1].strip()
            logger.info(f"Created new folder: {folder_name}")
            
            # Store folder embedding
            collection.add(
                documents=[folder_name],
                embeddings=[avg_embedding.tolist()],
                metadatas=[{
                    "user_email": email,
                    "folder_name": folder_name,
                    "is_folder_embedding": True
                }],
                ids=[f"{email}_{folder_name}_folder"]
            )
        
        # Upload file to Azure Blob Storage
        blob_path = f"{email}/{folder_name}/{file.filename}"
        container_client = blob_service_client.get_container_client(container_name)
        
        if not container_client.exists():
            container_client.create_container()
        
        blob_client = container_client.get_blob_client(blob_path)
        with open(temp_path, "rb") as data:
            blob_client.upload_blob(data, overwrite=True)
        
        # Store chunk embeddings in ChromaDB with folder name and file metadata
        file_chunk_indices = {file.filename: list(range(len(chunks)))}
        store_in_chromadb(
            collection=collection,
            all_chunks=chunks,
            embeddings=embeddings,
            file_to_cluster={file.filename: 0},
            cluster_names={0: folder_name},
            file_chunk_indices=file_chunk_indices,
            user_email=email,
            folder_name=folder_name,
            file_info=file_info
        )
        
        return {
            "message": "File uploaded successfully",
            "blob_path": blob_path,
            "folder_name": folder_name,
            "is_new_folder": not has_similar
        }
        
    except Exception as e:
        logger.error(f"Error in upload_file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    finally:
        # Clean up temp files
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)

@app.get("/list-files")
async def list_files(user_email: str):
    try:
        # Initialize the BlobServiceClient
        blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        container_client = blob_service_client.get_container_client(container_name)
        
        folder_files_map = {}

        # List all blobs in the container
        blobs = container_client.list_blobs()

        for blob in blobs:
            # Separate the path into user_email, folder_name, and file_name
            blob_path_parts = blob.name.split("/")

            # Ensure the path has the correct format
            if len(blob_path_parts) >= 3 and blob_path_parts[0] == user_email:
                folder_name = blob_path_parts[1]  
                file_name = blob_path_parts[2]    
                upload_datetime = blob.last_modified  
                
                # Format date as DD Month YYYY
                upload_date = upload_datetime.strftime("%d %B %Y")
                upload_time = upload_datetime.strftime("%H:%M")

                # Generate a public download URL using the SAS token
                blob_url = f"https://{blob_service_client.account_name}.blob.core.windows.net/{container_name}/{blob.name}?{sas_token}"

                # Add file to the corresponding folder in the dictionary
                if folder_name not in folder_files_map:
                    folder_files_map[folder_name] = []

                folder_files_map[folder_name].append({
                    "file_name": file_name,
                    "upload_date": upload_date,
                    "upload_time": upload_time,
                    "download_url": blob_url  # Added Download Link
                })

        return folder_files_map
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/folder_size")
def folder_size_api(user_email: str):
    try:
        print("User email: ", user_email)
        files = folder_size(user_email)
        return {"files": files}
    except Exception as e:
        print(f"Error listing files: {e}")
        return {"error": f"Error listing files: {e}"}
    
@app.post("/process-query")
async def process_query(request: QueryRequest):
    try:
        # Get files based on user_email and folder_name
        files = get_files(
            user_email=request.user_email,
            folder_name=request.folder_name
        )
        
        if not files:
            raise HTTPException(
                status_code=404,
                detail="No files found" + (
                    f" in folder {request.folder_name}" 
                    if request.folder_name else ""
                )
            )
        
        # Process the query using parse_query function
        result = parse_query(
            files=files,
            query=request.user_prompt,
            user_email=request.user_email,
            folder_name=request.folder_name
        )
        
        # Determine if the result is from query_clusters
        is_query_clusters_result = (
            isinstance(result, dict) and 
            all(key in result for key in ["response", "chunks_used", "total_chunks_available"])
        )
        if is_query_clusters_result:
            return result
        else:
            return {
                "user_email": request.user_email,
                "folder_name": request.folder_name,
                "response": result,
                "chunks_used": None,
                "total_chunks_available": None
            }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)