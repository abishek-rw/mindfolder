from docling.document_converter import DocumentConverter
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.node_parser.docling import DoclingNodeParser
from llama_index.readers.docling import DoclingReader

def convert_file_to_docling_docs(file_path: str):
    converter = DocumentConverter()
    reader = DoclingReader(export_type=DoclingReader.ExportType.JSON, doc_converter=converter)
    documents = reader.load_data(file_path)

    docstore = SimpleDocumentStore()
    docstore.add_documents(documents)

    output = docstore.to_dict()
    return output