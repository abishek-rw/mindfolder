# FC-Folder-Manager

This is the readme file for the fc-folder-manager project.

## Description

The fc-folder-manager provides endpoints to list, filter, sort, search, and group files stored in Azure Blob Storage. It also processes user queries to perform these operations.

## Installation

To install this project, follow these steps:

1. Clone the repository.
2. Navigate to the project directory.
3. Run `pip install -r requirements.txt` to install the dependencies.

## Usage

To use this project, follow these steps:

1. Open the terminal.
2. Navigate to the project directory.
3. Run `uvicorn main:app --port 8002` to start the application.

## Endpoints

- `POST /health`: Check the health status of the API.
- `POST /result`: List files for a given user email.
- `POST /process`: Process user query and return organized files.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.