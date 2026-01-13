# Local LLM Support - Technical Considerations

**Status:** Not implementing (January 2026)

**Reason:** Cannot achieve full privacy due to embedding dimension constraints.

---

## Feature Request

Allow users to configure a local/self-hosted LLM endpoint (Ollama, LM Studio, vLLM, etc.) for complete privacy - no data sent to cloud services.

**Requested models:** Mistral, Nemotron, GLM, and other open-source models that can run locally.

---

## The Good News: Common API Standard Exists

Most local model servers implement the **OpenAI-compatible API**:

| Server | OpenAI-Compatible | Default Port |
|--------|-------------------|--------------|
| Ollama | Yes | 11434 |
| LM Studio | Yes | 1234 |
| vLLM | Yes | 8000 |
| LocalAI | Yes | 8080 |
| llama.cpp | Yes | 8080 |

The OpenAI SDK supports custom `baseURL`, so switching providers is technically straightforward:

```typescript
new OpenAI({
  baseURL: "http://localhost:11434/v1",
  apiKey: "not-needed",
});
```

---

## Why Full Privacy Isn't Achievable

### 1. Embedding Dimension Mismatch

The Ra material is indexed in Pinecone using OpenAI's `text-embedding-3-small` model, which produces **1536-dimensional vectors**.

Local embedding models produce different dimensions:

| Model | Dimensions | Notes |
|-------|------------|-------|
| OpenAI `text-embedding-3-small` | **1536** | Current index |
| Ollama `nomic-embed-text` | 1024 | Popular local choice |
| Ollama `mxbai-embed-large` | 1024 | High quality |
| Ollama `all-minilm` | 384 | Lightweight |
| BGE models | 768-1024 | Open source |
| Most sentence-transformers | 768 | HuggingFace |

**Problem:** No popular local embedding model produces 1536 dimensions. Users would need to re-index all ~1,500 Ra material passages with their chosen local model, requiring:
- Running the indexing script locally
- Their own Pinecone account (or alternative vector DB)
- Significant setup complexity

### 2. Architecture Constraint

The app is hosted on Vercel. Serverless functions cannot reach `localhost` on a user's machine.

**Implication:** Local model calls must happen directly from the browser, not through the API routes. This creates two completely separate code paths:
- **OpenAI mode:** Browser → Vercel → OpenAI
- **Local mode:** Browser → localhost directly

### 3. Maintenance Burden

Supporting local models would require:
- Two code paths for all LLM features
- Testing with multiple local model servers
- User support for CORS issues, connection problems, model compatibility
- Feature parity drift as new features are added

---

## Partial Solution Considered

**"Local Chat Only" mode:**
- Use local model for chat responses (user's questions stay private)
- Keep using OpenAI for embeddings/search (just vectors, not the actual questions)

**Pros:**
- Simpler implementation
- User's actual questions never leave their machine
- Full RAG functionality preserved

**Cons:**
- Not fully private - OpenAI still processes embedding vectors
- May not satisfy users who want zero cloud dependency
- Still requires maintaining two code paths

**Decision:** Not worth the complexity for the small number of users who would benefit.

---

## What Would Make This Viable

1. **A popular local embedding model with 1536 dimensions** - Would allow using existing Pinecone index
2. **Standardized local vector DB** - Something like ChromaDB that users commonly run alongside Ollama
3. **Self-hosted deployment option** - Users run the entire app locally via Docker
4. **Significant user demand** - Currently this is a niche request

---

## References

- [Ollama Embedding Models](https://ollama.com/blog/embedding-models)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [nomic-embed-text](https://ollama.com/library/nomic-embed-text)
- [mxbai-embed-large](https://ollama.com/library/mxbai-embed-large)

---

## Future Reconsideration

Revisit this decision if:
- Multiple users request local model support
- A 1536-dimension local embedding model becomes popular
- We add a self-hosted deployment option
- The embedding landscape changes significantly
