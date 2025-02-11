from dotenv import load_dotenv
from llama_index.core.ingestion import IngestionPipeline
from docling.document_converter import DocumentConverter
from llama_index.core.storage.docstore import SimpleDocumentStore
from llama_index.node_parser.docling import DoclingNodeParser
from llama_index.readers.docling import DoclingReader
from llama_index.core.extractors import (
    TitleExtractor,
    QuestionsAnsweredExtractor,
)
from llama_index.extractors.entity import EntityExtractor
from llama_index.core.node_parser import TokenTextSplitter
from sentence_transformers import SentenceTransformer
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.core import StorageContext, VectorStoreIndex
import chromadb
from chromadb.config import Settings as ChromaSettings
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.gemini import Gemini
from llama_index.llms.ollama import Ollama
from llama_index.core import Settings
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.pipeline_options import PdfPipelineOptions, TableFormerMode, AcceleratorDevice, AcceleratorOptions, RapidOcrOptions
from docling.datamodel.base_models import InputFormat
from docling.backend import pypdfium2_backend
from docling.chunking import HybridChunker
from llama_index.core.storage.docstore import SimpleDocumentStore
import re
from llama_index.core.schema import TextNode
from llama_index.core.vector_stores.types import (
    MetadataFilter,
    MetadataFilters,
)
from llama_index.core.response_synthesizers import CompactAndRefine
from llama_index.core.retrievers import QueryFusionRetriever
from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.core import Settings
from llama_index.core.callbacks import CallbackManager, LlamaDebugHandler

llama_debug = LlamaDebugHandler(print_trace_on_end=True)
callback_manager = CallbackManager([llama_debug])

Settings.callback_manager = callback_manager
import nltk
nltk.download('punkt_tab')

load_dotenv()

# --- Configuration ---
EMBEDDING_MODEL_NAME = "all-MiniLM-L12-v2"
OLLAMA_MODEL_NAME = "llama3.1"  # Or the name of your Gemini model
CHROMA_PERSIST_DIR = "chroma_data"
DEVICE = "cuda"  # Or "cpu" or "mps" if available
DOCLING_EXPORT_TYPE = DoclingReader.ExportType.JSON
NUM_THREADS = 4  # Number of threads

# --- Initialize Components ---

# 1. Embeddings
try:
    embedder = HuggingFaceEmbedding(
        model_name=EMBEDDING_MODEL_NAME, device=DEVICE)
    Settings.embed_model = embedder
    print("Embeddings loaded successfully.")
except Exception as e:
    print(f"Error loading embeddings: {e}")
    raise

# 2. LLM
try:
    llm = Ollama(model=OLLAMA_MODEL_NAME)
    Settings.llm = llm
    print("LLM loaded successfully.")
except Exception as e:
    print(f"Error loading LLM: {e}")
    raise


# 3. Chunking
try:
    chunker = HybridChunker()
    print("Chunker loaded successfully.")
except Exception as e:
    print(f"Error loading chunker: {e}")
    raise


# 4. ChromaDB
try:
    # chroma_client = chromadb.HttpClient(host='127.0.0.1', port=8001, settings=ChromaSettings(
    #     allow_reset=True, anonymized_telemetry=False))
    chroma_client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    print("ChromaDB loaded successfully.")
except Exception as e:
    print(f"Error loading ChromaDB: {e}")
    raise

# 5. Extractors
try:
    title_extractor = TitleExtractor(nodes=5)
    entity_extractor = EntityExtractor(
        prediction_threshold=0.5, label_entities=False, device="cpu"
    )  # Device set to "cpu" - adjust if needed
    print("Extractors loaded successfully.")
except Exception as e:
    print(f"Error loading extractors: {e}")
    raise

# 6. Ingestion Pipeline
try:
    pipeline = IngestionPipeline(transformations=[])
    print("Ingestion pipeline loaded successfully.")
except Exception as e:
    print(f"Error loading ingestion pipeline: {e}")
    raise

# 7. Docling Components
try:
    node_parser = DoclingNodeParser()
    ocr_options = RapidOcrOptions()
    pipeline_options = PdfPipelineOptions(
        do_table_structure=True, do_ocr=True, do_text_structure=True
    )
    pipeline_options.ocr_options = ocr_options
    pipeline_options.ocr_options.lang = ["en"]
    pipeline_options.accelerator_options = AcceleratorOptions(
        num_threads=NUM_THREADS, device=AcceleratorDevice.AUTO
    )
    pipeline_options.table_structure_options.do_cell_matching = False
    pipeline_options.table_structure_options.mode = TableFormerMode.ACCURATE

    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_options=pipeline_options,
                backend=pypdfium2_backend.PyPdfiumDocumentBackend,
            )
        }
    )
    print("Docling components loaded successfully.")
except Exception as e:
    print(f"Error loading Docling components: {e}")
    raise


async def convert_file_to_llamaindex_nodes(file_path: str):
    # try:
    #     reader = DoclingReader(
    #         export_type=DOCLING_EXPORT_TYPE, doc_converter=converter)
    #     documents = reader.load_data(file_path)
    #     # docstore = SimpleDocumentStore()
    #     # docstore.add_documents(documents)
    #     # documents = docstore.to_dict()
    #     # doc_store = SimpleDocumentStore.from_dict(documents)
    #     # documents = doc_store.docs.values()
    #     nodes = node_parser.get_nodes_from_documents(documents)
    #     for node in nodes:
    #         node.metadata["file_path"] = file_path  # Add file ID to metadata
    #     return nodes
    # except Exception as e:
    #     print(f"Error converting file to nodes: {e}")
    #     raise
    try:
        doc = converter.convert(source=file_path).document
        chunk_iter = chunker.chunk(dl_doc=doc)
        chunks = []
        for i, chunk in enumerate(chunk_iter):
            text_content = chunker.serialize(chunk=chunk)
            print(f"Chunk {i}: {text_content}")
            # chunks.append(chunker.serialize(chunk=chunk))
            chunks.append(TextNode(
                text=text_content,
                metadata={
                    "file_path": file_path
                }))
        print("Chunks: ", chunks)
        return chunks
    except Exception as e:
        print(f"Error converting file to nodes: {e}")
        raise


def init_vector_store(nodes, email: str):
    try:
        # Clean the email (remove @ and . and other non-alphanumeric, underscore, or hyphen)
        safe_email = re.sub(r"[^a-zA-Z0-9_-]+", "_", email)

        # Create the base collection name
        base_collection_name = f"{safe_email}"

        # Truncate if it exceeds the maximum length (63 characters)
        collection_name = base_collection_name[:63]

        # Ensure it starts and ends with an alphanumeric character
        collection_name = re.sub(
            r"^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$", "", collection_name
        )

        vector_store = ChromaVectorStore.from_params(
            collection_name=collection_name, persist_dir=CHROMA_PERSIST_DIR
        )
        index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store, show_progress=True, embed_model=embedder,
        )
        print("Example metdata: ", nodes[0].metadata)
        index.insert_nodes(nodes=nodes)
        print(
            f"Vector store initialized and nodes inserted for email: {email}")
        return index
    except Exception as e:
        print(f"Error initializing vector store: {e}")
        raise


async def query_vector_store(email: str, query: str, filenames: list[str] = None):
    try:
        # Clean the email (remove @ and . and other non-alphanumeric, underscore, or hyphen)
        safe_email = re.sub(r"[^a-zA-Z0-9_-]+", "_", email)

        # Create the base collection name
        base_collection_name = f"{safe_email}"

        # Truncate if it exceeds the maximum length (63 characters)
        collection_name = base_collection_name[:63]

        # Ensure it starts and ends with an alphanumeric character
        collection_name = re.sub(
            r"^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$", "", collection_name
        )

        vector_store = ChromaVectorStore.from_params(
            collection_name=collection_name, persist_dir=CHROMA_PERSIST_DIR
        )
        hybrid_index = VectorStoreIndex.from_vector_store(
            vector_store=vector_store)
        filters = MetadataFilters(
            filters=[MetadataFilter(key="file_path", value=fileId)
                     for fileId in filenames],
            condition="or",
        ) if filenames else None
        print("FILTERS", filters)
        vector_retriever = hybrid_index.as_retriever(
            vector_store_query_mode="default",
            similarity_top_k=5
        )
        text_retriever = hybrid_index.as_retriever(
            vector_store_query_mode="sparse",
            similarity_top_k=5,  # interchangeable with sparse_top_k in this context
        )
        retriever = QueryFusionRetriever(
            [vector_retriever, text_retriever],
            similarity_top_k=5,
            num_queries=1,  # set this to 1 to disable query generation
            mode="relative_score",
            use_async=False,
        )

        response_synthesizer = CompactAndRefine()
        query_engine = RetrieverQueryEngine(
            retriever=retriever,
            # response_synthesizer=response_synthesizer,
        )
        response = query_engine.query(query)
        return {"response": response.response}
    except Exception as e:
        print(f"Error querying vector store: {e}")
        raise
