from ollama import Client
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
import os
import pickle
from fastapi import FastAPI, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timedelta
import json
from typing import List, Dict, Any, Callable
import re
from pydantic import BaseModel
from azure.storage.blob import BlobServiceClient
import uvicorn
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("uvicorn.error")
logger.setLevel(logging.DEBUG)

app = FastAPI()

connection_string = os.getenv("CONNECTION_STRING")
logger.info(f"Connection string: {connection_string}")
container_name = os.getenv("CONTAINER_NAME")

class ProcessRequest(BaseModel):
    user_email: str
    prompt: str


origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Allow specific origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods (e.g., GET, POST)
    allow_headers=["*"],  # Allow all headers
)

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]
CLIENT_SECRET_FILE = "client_secrets.json"
API_NAME = "drive"
PORT = 8003


# def authenticate_gdrive():
#     creds = None
#     if os.path.exists("token.pickle"):
#         with open("token.pickle", "rb") as token:
#             creds = pickle.load(token)
#     if not creds or not creds.valid:
#         if creds and creds.expired and creds.refresh_token:
#             creds.refresh(Request())
#         else:
#             flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRET_FILE, SCOPES)
#             creds = flow.run_local_server(port=PORT)
#         with open("token.pickle", "wb") as token:
#             pickle.dump(creds, token)
#     return build(API_NAME, "v3", credentials=creds)


# def list_files_gdrive():
#     service = authenticate()
#     results = (
#         service.files()
#         .list(pageSize=100, fields="nextPageToken, files(name, size, createdTime)")
#         .execute()
#     )
#     items = results.get("files", [])
#     if not items:
#         print("No files found.")
#     else:
#         print("Files:")
#         formatted_items = []  # List to store formatted metadata
#         for item in items:
#             size = item.get("size")
#             if size:
#                 size = int(float(size))
#                 if size >= 1024**3:
#                     size = f"{size / (1024**3):.2f} GB"
#                 elif size >= 1024**2:
#                     size = f"{size / (1024**2):.2f} MB"
#                 else:
#                     size = f"{size / 1024:.2f} KB"

#             # Convert createdTime to 24-hour format
#             created_time = item["createdTime"]
#             created_time = datetime.strptime(created_time, "%Y-%m-%dT%H:%M:%S.%fZ")
#             created_time = created_time + timedelta(hours=5, minutes=30)
#             formatted_created_time = created_time.strftime("%Y-%m-%d %H:%M:%S")

#             print(
#                 f"Name: {item['name']}, Size: {size}, Created: {formatted_created_time}"
#             )
#             metadata = {
#                 "name": item["name"],
#                 "size": size,
#                 "created": formatted_created_time,
#             }
#             formatted_items.append(metadata)
#     return formatted_items

# local_folder_path = "C:\\tmp"

# def list_files_local():
#     items = []
#     try:
#         for filename in os.listdir(local_folder_path):
#             file_path = os.path.join(local_folder_path, filename)
#             if os.path.isfile(file_path):
#                 size = os.path.getsize(file_path)
#                 if size >= 1024**3:
#                     size = f"{size / (1024**3):.2f} GB"
#                 elif size >= 1024**2:
#                     size = f"{size / (1024**2):.2f} MB"
#                 else:
#                     size = f"{size / 1024:.2f} KB"

#                 metadata = {
#                     "name": filename,
#                     "size": size,
#                     "created": datetime.datetime.fromtimestamp(os.path.getmtime(file_path)).strftime('%Y-%m-%d %H:%M:%S'),
#                 }
#                 items.append(metadata)
#                 print(f"Name: {metadata['name']}, Size: {metadata['size']}, Created: {metadata['created']}")
#         return items
#     except Exception as e:
#         print(f"Error listing files: {e}")
#         return {"error": f"Error listing files: {e}"} 

def upload_file_azure_blob(file_path, user_email):
    """
    Uploads a file to a user's folder in Azure Blob Storage.

    :param user_email: Email address of the user (used as folder name).
    :param file_path: Local path of the file to upload.
    """
    # Initialize BlobServiceClient
    blob_service_client = BlobServiceClient.from_connection_string(connection_string)
    container_client = blob_service_client.get_container_client(container_name)
    
    user_prefix = f"{user_email}/"
    blob_list = container_client.list_blobs(name_starts_with=user_prefix)

    # If folder doesn't exist, it will be created implicitly when the file is uploaded
    if not blob_list:
        print(f"Folder '{user_prefix}' does not exist. It will be created.")
        
    # after checking if the folder exists, upload the file
    file_name = os.path.basename(file_path)
    blob_client = container_client.get_blob_client(f"{user_prefix}{file_name}")
    with open(file_path, "rb") as data:
        blob_client.upload_blob(data, overwrite=True)
    return {"message": f"File '{file_name}' uploaded successfully."}

def get_size_in_bytes(file: Dict):
    if not file.get("size"):
        return 0
    try:
        size_str = file["size"].split()[0]
        unit = file["size"].split()[1]
        size = float(size_str)
        if unit == "GB":
            return size * 1024**3
        elif unit == "MB":
            return size * 1024**2
        else:  # KB
            return size * 1024
    except (AttributeError, IndexError, ValueError):
        return 0


def sort_files(files: List[Dict], sort_by: str = "size", reverse: bool = True):

    valid_files = [f for f in files if f is not None]

    if sort_by == "size":
        return sorted(valid_files, key=get_size_in_bytes, reverse=reverse)

    elif sort_by == "date":

        def get_date(file):
            try:
                return datetime.strptime(
                    file.get("created", "1970-01-01 00:00:00"), "%Y-%m-%d %H:%M:%S"
                )
            except (ValueError, TypeError):
                return datetime.min

        return sorted(valid_files, key=get_date, reverse=reverse)

    elif sort_by == "name":

        def get_name(file):
            return file.get("name", "").lower()

        return sorted(valid_files, key=get_name, reverse=reverse)

    return valid_files


def filter_files(
    files: List[Dict],
    min_size: float = None,
    max_size: float = None,
    date_after: str = None,
    date_before: str = None,
    file_types: List[str] = None,
):

    result = [f for f in files if f is not None]

    if min_size is not None:
        result = [f for f in result if get_size_in_bytes(f) >= min_size]
    if max_size is not None:
        result = [f for f in result if get_size_in_bytes(f) <= max_size]
    if date_after:
        date_after = datetime.strptime(date_after, "%Y-%m-%d")
    if date_before:
        date_before = datetime.strptime(date_before, "%Y-%m-%d")

    if date_after or date_before:
        result = [
            f
            for f in result
            if f.get("created")
            and (
                (
                    not date_after
                    or datetime.strptime(f["created"], "%Y-%m-%d %H:%M:%S")
                    >= date_after
                )
                and (
                    not date_before
                    or datetime.strptime(f["created"], "%Y-%m-%d %H:%M:%S")
                    <= date_before
                )
            )
        ]
    if file_types:
        file_types = [t.lower().lstrip(".") for t in file_types]
        result = [
            f
            for f in result
            if f.get("name")
            and "." in f["name"]
            and f["name"].split(".")[-1] in file_types
        ]

    return result


def search_files(files: List[Dict], query: str):
    if not query:
        return [f for f in files if f is not None]
    query = query.lower()
    return [
        f
        for f in files
        if f is not None and f.get("name") and query in f["name"].lower()
    ]


def group_files(files: List[Dict], group_by: str = "type"):
    print("avc")
    valid_files = [f for f in files if f is not None]
    groups = {}

    if group_by == "type":
        for file in valid_files:
            file_type = (
                file["name"].split(".")[-1] if "." in file["name"] else "unknown"
            )
            if file_type not in groups:
                groups[file_type] = []
            groups[file_type].append(file)

    elif group_by == "size_range":
        for file in valid_files:
            if not file.get("size"):
                continue
            size = get_size_in_bytes(file)

            if size < 1024**2:  # < 1MB
                range_key = "Small (<1MB)"
            elif size < 100 * 1024**2:  # < 100MB
                range_key = "Medium (1-100MB)"
            else:
                range_key = "Large (>100MB)"

            if range_key not in groups:
                groups[range_key] = []
            groups[range_key].append(file)

    elif group_by == "date":
        for file in valid_files:
            if not file.get("created"):
                continue
            created_date = datetime.strptime(file["created"], "%Y-%m-%d %H:%M:%S")
            year = created_date.year
            month = created_date.month
            day = created_date.day
            if group_by == "date":
                if year not in groups:
                    groups[year] = {}
                if month not in groups[year]:
                    groups[year][month] = {}
                if day not in groups[year][month]:
                    groups[year][month][day] = []
                groups[year][month][day].append(file)

    elif group_by == "month":
        for file in valid_files:
            if not file.get("created"):
                continue
            created_date = datetime.strptime(file["created"], "%Y-%m-%d %H:%M:%S")
            year = created_date.year
            month = created_date.month

            if year not in groups:
                groups[year] = {}
            if month not in groups[year]:
                groups[year][month] = []
            groups[year][month].append(file)

    elif group_by == "year":
        for file in valid_files:
            if not file.get("created"):
                continue
            created_date = datetime.strptime(file["created"], "%Y-%m-%d %H:%M:%S")
            year = created_date.year

            if year not in groups:
                groups[year] = []
            groups[year].append(file)

    print("Groups: ", groups)
    return groups


def execute_plans(
    plan_text: str, files: List[Dict], available_functions: Dict[str, Callable]
):
    """
    Parse and execute a series of plans from a text output, calling functions sequentially
    and passing evidence between steps.

    Args:
        plan_text: String containing plans in the format "Plan: description\n#Ex = function_name[{...}]"
        available_functions: Dictionary mapping function names to their implementations

    Returns:
        The final evidence value from the last executed step

    Example:
        functions = {
            'filter_files': my_filter_function,
            'group_files': my_group_function
        }
        result = execute_plans(plan_text, functions)
    """
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
            # print("not matched: ", plan)
            continue

        evidence_id, function_name, params_str = match.groups()

        # Parse the function parameters
        try:
            # Clean up the parameters string and parse as JSON
            params_str = params_str.strip()
            params = json.loads(params_str)

            # Check if function exists
            if function_name not in available_functions:
                raise ValueError(f"Unknown function: {function_name}")

            # Execute the function with the parameters
            function = available_functions[function_name]
            result = function(files_rem, **params)
            files_rem = result

            # Store the evidence for potential future use
            evidence[evidence_id] = result

        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON parameters in plan: {params_str}")
        except Exception as e:
            raise Exception(
                f"Error executing plan with function {function_name}: {str(e)}"
            )

    # Return the last evidence value if any plans were executed
    if evidence:
        return evidence[max(evidence.keys())]
    return None


def parse_query(files: List[Dict], query: str):
    try:
        ollama_client = Client(host="http://172.16.1.233:11434/")
        ollama_client.pull("mistral-nemo:12b-instruct-2407-q4_1")
        logger.debug("Pulled model")
        system_prompt = """
        Convert the user's file organization query into a series of file operation instructions.
        For the following task, make plans that can solve the problem step by step. For each plan, indicate which external tool together with tool input to retrieve evidence. You can store the evidence into a variable #E that can be called by later tools. (Plan, #E1, Plan, #E2, Plan, ...)
        
        Only use the tools that you absolutely need to.
        
        You have access to the following tools:
        [
                {
                    "type": "function",
                    "function": {
                        "name": "sort_files",
                        "description": "Sort files based on size, date, or name",
                        "parameters": {
                            "type": "list",
                            "properties": {
                                "sort_by": {
                                    "description": "The property to sort by",
                                    "enum": ["size", "date", "name"],
                                    "type": "string",
                                },
                                "reverse": {
                                    "description": "Sort in reverse order",
                                    "type": "boolean",
                                },
                            },
                            "required": ["sort_by"],
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "filter_files",
                        "description": "Filter files based on size, date, or file type",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "min_size": {"type": "number"},
                                "max_size": {"type": "number"},
                                "date_after": {
                                    "description": "Filter files created after this date, in the format 'YYYY-MM-DD'",
                                    "type": "string",
                                },
                                "date_before": {
                                    "type": "string",
                                    "description": "Filter files created before this date, in the format 'YYYY-MM-DD'",
                                },
                                "file_types": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                },
                            },
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "search_files",
                        "description": "Search files by name",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "query": {"type": "string"},
                            },
                            "required": ["query"],
                        },
                    },
                },
                {
                    "type": "function",
                    "function": {
                        "name": "group_files",
                        "description": "Group files by type or size range or date(inclusive)",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "group_by": {
                                    "description": "The property to group by",
                                    "type": "string",
                                    "enum": [
                                        "type",
                                        "size_range",
                                        "date",
                                        "month",
                                        "year",
                                    ],
                                },
                            },
                            "required": ["group_by"],
                        },
                    },
                },
            ]
            
        Examples:
        Example 1:
        Task: Group all files by months in 2023
        Plan: Filter all files by the year 2023. #E1 = filter_files[{"date_after": "2023-01-01", "date_before": "2023-12-31"}]
        Plan: Group remaining files by months. #E2 = group_files[{"group_by":"month"}]
        
        Example 2:
        Task: Give all the files
        Plan: No plan required. #E1 = filter_files[{}]
        
        Example 3:
        Task: Group by months
        Plan: Group all files from every year by months. #E1 = group_files[{"group_by":"month"}]
        
        Example 4:
        Task: Group files by different months in 2024.
        Plan: Filter all files created in the year 2024. #E1 = filter_files[{"date_after": "2024-01-01", "date_before": "2024-12-31"}]
        Plan: Group remaining files by months. #E2 = group_files[{"group_by":"month"}]
        """

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query},
        ]

        response = ollama_client.chat(
            model="mistral-nemo:12b-instruct-2407-q4_1",
            messages=messages,
            options={"temperature": 0.1},
        )

        response_text = response["message"]["content"]
        print("RAW RESP: ", response_text)
        return execute_plans(
            response["message"]["content"],
            files,
            {
                "sort_files": sort_files,
                "filter_files": filter_files,
                "search_files": search_files,
                "group_files": group_files,
            },
        )

    except Exception as e:
        print(f"Error parsing query: {e}")
        return []


def process_tool_calls(files: List[Dict], tool_calls: List[Dict[str, Any]]):
    print("ALL CALLS: ", tool_calls)
    try:
        result = files

        for tool_call in tool_calls:
            print("TOOL CALL: ", tool_call)
            # Extract function name and arguments from tool call
            function = tool_call.get("function", {})
            func_name = function.get("name")
            arguments = function.get("arguments", {})

            # Map function names to operations
            if func_name == "sort_files":
                result = sort_files(result, **arguments)
            if func_name == "filter_files":
                result = filter_files(result, **arguments)
            if func_name == "search_files":
                result = search_files(result, arguments.get("query", ""))
            if func_name == "group_files":
                result = group_files(result, arguments.get("group_by"))
            else:
                raise ValueError(f"Unknown function name: {func_name}")

        # Format response
        if isinstance(result, dict):
            return {"type": "grouped", "groups": result}
        return {"type": "list", "files": result}

    except Exception as e:
        print(f"Error processing tool calls: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/health")
async def health():
    return {"status": "ok"}


@app.post("/result")
async def file_data(user_email: str = Form(...)):
    try:
        files = list_files_azure_blob(user_email)
        print("FIles: ", files)
        return {"files": files}
    except Exception as e:
        print(f"Error listing files: {e}")
        return {"error": f"Error listing files: {e}"}
    
@app.post("/upload")
async def upload_file(file_path: str = Form(...), user_email: str = Form(...)):
    try:
        result = upload_file_azure_blob(file_path, user_email)
        return result
    except Exception as e:
        print(f"Error uploading file: {e}")
        return {"error": f"Error uploading file: {e}"}
    
@app.get("/folder_size")
def folder_size_api(user_email: str):
    try:
        print("User email: ", user_email)
        files = folder_size(user_email)
        return {"files": files}
    except Exception as e:
        print(f"Error listing files: {e}")
        return {"error": f"Error listing files: {e}"}


@app.post("/process")
def process(request: ProcessRequest):
    prompt = request.prompt
    user_email = request.user_email
    """Process user query and return organized files."""
    try:
        # Get file list
        files = list_files_azure_blob(user_email)

        # Parse query into operations
        result = parse_query(files, prompt)

        return result

    except Exception as e:
        print(f"Error processing prompt: {e}")
        return {"error": f"Error processing prompt: {e}"}


if __name__ == "__main__":
    uvicorn.run(host="0.0.0.0", port=8080)
