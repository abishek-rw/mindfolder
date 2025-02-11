from datetime import datetime
import json
import re
from typing import Callable, Dict, List
import logging
from ollama import Client

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_size_in_bytes(file: Dict):
    if not file.get("size"):
        return 0
    try:
        size_in_mb = float(file["size"])
        return size_in_mb * 1024**2  # Convert MB to bytes
    except (ValueError, TypeError):
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
    
    # Filter by size (using file_size_in_bytes for precision)
    if min_size is not None:
        result = [f for f in result if f.get("file_size_in_bytes", 0) >= min_size]
    if max_size is not None:
        result = [f for f in result if f.get("file_size_in_bytes", 0) <= max_size]
    
    # Filter by date
    if date_after:
        date_after = datetime.strptime(date_after, "%Y-%m-%d")
    if date_before:
        date_before = datetime.strptime(date_before, "%Y-%m-%d")
    if date_after or date_before:
        result = [
            f
            for f in result
            if f.get("file_date")
            and (
                (
                    not date_after
                    or datetime.strptime(f["file_date"], "%Y-%m-%d") >= date_after
                )
                and (
                    not date_before
                    or datetime.strptime(f["file_date"], "%Y-%m-%d") <= date_before
                )
            )
        ]
    
    # Filter by file type
    if file_types:
        file_types = [t.lower().lstrip(".") for t in file_types]  
        result = [
            f
            for f in result
            if f.get("file_type") and f["file_type"].lower() in file_types
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
            if not file.get("file_date"):
                continue
            created_date = datetime.strptime(file["file_date"], "%Y-%m-%d")
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
            if not file.get("file_date"):
                continue
            created_date = datetime.strptime(file["file_date"], "%Y-%m-%d")
            year = created_date.year
            month = created_date.month

            if year not in groups:
                groups[year] = {}
            if month not in groups[year]:
                groups[year][month] = []
            groups[year][month].append(file)

    elif group_by == "year":
        for file in valid_files:
            if not file.get("file_date"):
                continue
            created_date = datetime.strptime(file["file_date"], "%Y-%m-%d")
            year = created_date.year

            if year not in groups:
                groups[year] = []
            groups[year].append(file)

    print("Groups: ", groups)
    return groups


