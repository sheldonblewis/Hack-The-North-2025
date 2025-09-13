#!/usr/bin/env python3
"""
VectorDB: Cohere (v2) embeddings + local ChromaDB (persistent).

- Stores the ChromaDB directory path on the instance
- Creates (or opens) a collection on init
- Methods to add/upsert texts and query top-K by similarity

Usage:

from vector_db import VectorDB

vdb = VectorDB(
    db_dir="./chroma_db",
    collection="my_collection",
    cohere_model="embed-v4.0",
    output_dim=1024
)

# Add / upsert
ids = vdb.add_texts(
    texts=["hello world", "goodbye world"],
    metadatas=[{"tag": "greeting"}, {"tag": "farewell"}]
)
print("Upserted IDs:", ids)

# Query
res = vdb.query("farewell", k=3)
print(res)
"""

from __future__ import annotations
import os
import uuid
from typing import List, Dict, Optional, Any

try:
    from dotenv import load_dotenv
    load_dotenv()
except Exception:
    pass

import cohere
import chromadb
from chromadb import PersistentClient


class VectorDB:
    """
    A small wrapper around ChromaDB that uses Cohere v2 embeddings.

    Attributes
    ----------
    db_dir : str
        Filesystem directory for Chroma persistence (stored on the instance).
    collection_name : str
        Chroma collection name.
    cohere_model : str
        Cohere embedding model ID (e.g., "embed-v4.0").
    output_dim : int
        Embedding dimension (embed-v4.* supports 256/512/1024/1536).
    input_truncate : str
        Truncation strategy passed to Cohere ("START" | "END" | "NONE").
    """

    def __init__(
        self,
        db_dir: str = "./chroma_db",
        collection: str = "cohere_embeddings",
        cohere_api_key: Optional[str] = None,
        cohere_model: str = "embed-v4.0",
        output_dim: int = 1024,
        input_truncate: str = "END",
    ) -> None:
        """
        Initialize the vector DB.

        Parameters
        ----------
        db_dir : str
            Directory for the Chroma persistent DB (will be created if missing).
        collection : str
            Name of the Chroma collection to create/open.
        cohere_api_key : Optional[str]
            If None, will read from COHERE_API_KEY env var.
        cohere_model : str
            Cohere embedding model ID.
        output_dim : int
            Desired embedding dimension.
        input_truncate : str
            Truncation strategy for Cohere (default "END").
        """
        self.db_dir = db_dir  # <- stored on the instance as requested
        self.collection_name = collection
        self.cohere_model = cohere_model
        self.output_dim = int(output_dim)
        self.input_truncate = input_truncate

        # Configure Cohere client
        self._cohere_api_key = os.getenv("COHERE_API_KEY")
        if not self._cohere_api_key:
            raise RuntimeError("COHERE_API_KEY not set. Export it or pass cohere_api_key=...")

        self._co = cohere.ClientV2(api_key=self._cohere_api_key)

        # Configure Chroma client & collection
        os.makedirs(self.db_dir, exist_ok=True)
        self._client: PersistentClient = chromadb.PersistentClient(path=self.db_dir)

        # Prefer cosine distance for embeddings
        try:
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )
        except TypeError:
            # Older Chroma versions might not accept metadata
            self._collection = self._client.get_or_create_collection(name=self.collection_name)

    # ---------------------------
    # Embedding helpers
    # ---------------------------
    def _embed_docs(self, texts: List[str]) -> List[List[float]]:
        """
        Embed texts for storage in the vector DB. Uses input_type='search_document'.
        """
        if not texts:
            return []
        resp = self._co.embed(
            texts=texts,
            model=self.cohere_model,
            input_type="search_document",
            output_dimension=self.output_dim,
            embedding_types=["float"],
            truncate=self.input_truncate,
        )
        return resp.embeddings["float"]  # type: ignore[index]

    def _embed_query(self, text: str) -> List[float]:
        """
        Embed a single query string. Uses input_type='search_query'.
        """
        resp = self._co.embed(
            texts=[text],
            model=self.cohere_model,
            input_type="search_query",
            output_dimension=self.output_dim,
            embedding_types=["float"],
            truncate=self.input_truncate,
        )
        return resp.embeddings["float"][0]  # type: ignore[index]

    # ---------------------------
    # Public API
    # ---------------------------
    def add_texts(
        self,
        texts: List[str],
        ids: Optional[List[str]] = None,
        metadatas: Optional[List[Dict[str, Any]]] = None,
    ) -> List[str]:
        """
        Upsert (add or replace) texts with embeddings into the collection.

        Parameters
        ----------
        texts : List[str]
            Documents to store.
        ids : Optional[List[str]]
            Stable IDs. If None, generated UUIDs.
        metadatas : Optional[List[Dict[str, Any]]]
            Optional metadata per document.

        Returns
        -------
        List[str]
            The IDs stored in the collection (one per text).
        """
        if not texts:
            return []

        n = len(texts)
        if ids is None:
            ids = [str(uuid.uuid4()) for _ in range(n)]
        if metadatas is None:
            metadatas = [{} for _ in range(n)]
        if len(ids) != n or len(metadatas) != n:
            raise ValueError("Lengths of texts, ids, and metadatas must match.")

        embeddings = self._embed_docs(texts)

        # Use upsert if available, else emulate with delete+add
        if hasattr(self._collection, "upsert"):
            self._collection.upsert(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
            )
        else:
            try:
                self._collection.delete(ids=ids)
            except Exception:
                pass
            self._collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=texts,
                metadatas=metadatas,
            )
        return ids

    def query(
        self,
        query_text: str,
        k: int = 5,
        include: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Query top-K most similar documents to `query_text`.

        Parameters
        ----------
        query_text : str
            The natural-language query.
        k : int
            Number of nearest neighbors to return (default 5).
        include : Optional[List[str]]
            Extra fields to include (defaults to ["distances", "metadatas", "documents"]).

        Returns
        -------
        Dict[str, Any]
            A normalized result dict with IDs, documents, metadatas, and distances.
        """
        if k <= 0:
            raise ValueError("k must be a positive integer")

        if include is None:
            include = ["distances", "metadatas", "documents"]

        q_emb = self._embed_query(query_text)
        res = self._collection.query(
            query_embeddings=[q_emb],
            n_results=k,
            include=include,
        )
        # Normalize (single-query)
        return {
            "query": query_text,
            "ids": res.get("ids", [[]])[0],
            "documents": res.get("documents", [[]])[0],
            "metadatas": res.get("metadatas", [[]])[0],
            "distances": res.get("distances", [[]])[0],
        }

    # ---------------------------
    # Optional utilities
    # ---------------------------
    def reset(self) -> None:
        """Delete the entire collection (irreversible)."""
        self._client.delete_collection(self.collection_name)
        # Recreate it
        try:
            self._collection = self._client.get_or_create_collection(
                name=self.collection_name,
                metadata={"hnsw:space": "cosine"},
            )
        except TypeError:
            self._collection = self._client.get_or_create_collection(name=self.collection_name)

    def count(self) -> int:
        """Return number of items in the collection."""
        try:
            return self._collection.count()
        except Exception:
            # Some versions lack count(); emulate with get
            got = self._collection.get(limit=1_000_000)
            return len(got.get("ids", []))

    def get_db_dir(self) -> str:
        """Expose the stored DB directory (as requested)."""
        return self.db_dir


# Optional: small demo
if __name__ == "__main__":
    vdb = VectorDB(db_dir="./chroma_db", collection="demo_collection")
    print("DB dir stored on instance:", vdb.get_db_dir())

    print("Upserting sample docs…")

    vdb.add_texts(
        texts=[
            "The Eiffel Tower is in Paris.",
            "CN Tower is a landmark in Toronto.",
            "Mount Fuji is an iconic volcano in Japan.",
        ],
        metadatas=[
            {"city": "Paris"},
            {"city": "Toronto"},
            {"country": "Japan"},
        ],
    )

    print("Collection count:", vdb.count())

    print("\nQuerying for: 'famous tower in Canada'")
    results = vdb.query("famous tower in Canada", k=2)
    for i, (rid, text, meta, dist) in enumerate(
        zip(results["ids"], results["documents"], results["metadatas"], results["distances"]),
        start=1,
    ):
        print(f"[{i}] id={rid}  distance={dist:.6f}")
        print(f"     text: {text}")
        if meta:
            print(f"     meta: {meta}")