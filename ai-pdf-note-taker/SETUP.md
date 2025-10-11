# AI PDF Note Taker - Complete Setup Guide

## 🚀 What's Implemented

This app now features a complete AI-powered PDF processing pipeline:

1. **PDF Upload** → User uploads PDF via UI
2. **Text Extraction** → pdfjs-dist extracts text from PDF
3. **Text Chunking** → LangChain splits text into manageable chunks (1000 chars, 200 overlap)
4. **Embeddings** → Google Generative AI creates vector embeddings (text-embedding-004 model)
5. **Vector Storage** → Convex stores embeddings with vector search index
6. **Semantic Search** → Query PDFs using natural language

## 📋 Prerequisites

- Node.js >= 18
- npm or yarn
- Google API Key (for Generative AI)
- Convex account and project

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
cd ai-pdf-note-taker
npm install
```

### 2. Set Up Environment Variables

Create `.env.local` in the project root:

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Google Generative AI
GOOGLE_API_KEY=AIza...
```

**Get your Google API Key:**
1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy and add to `.env.local`

### 3. Deploy Convex Schema and Functions

```bash
# Start Convex dev (deploys schema and functions)
npx convex dev
```

This will:
- Deploy the schema with `documents` table and vector index
- Deploy all mutations, queries, and actions
- Generate typed API helpers

### 4. Run the App

In a separate terminal:

```bash
npm run dev
```

Open http://localhost:3000

## 🏗️ Architecture

### Convex Schema (`convex/schema.js`)

Three main tables:

1. **pdfFiles** - Stores uploaded PDF metadata
2. **embeddings** - Legacy table (kept for compatibility)
3. **documents** - Main vector store with:
   - `text`: Chunk content
   - `embedding`: 768-dimensional vector
   - `metadata`: File info, chunk index, etc.
   - **Vector Index**: `byEmbedding` for similarity search

### Key Files

```
convex/
├── schema.js              # Database schema with vector index
├── myActions.ts           # Main PDF processing action
├── langchain/
│   └── db.js             # Vector database accessors
├── queries.js            # Helper queries
├── fileStorage.js        # File upload mutations
└── package.json          # Convex-specific dependencies

app/
├── api/
│   └── pdf-loader/
│       └── route.js      # Alternative API route (optional)
└── dashboard/
    └── _components/
        └── UploadPdfDialog.js  # Upload UI with processing
```

### Processing Flow

1. **Upload** (`UploadPdfDialog.js`):
   ```javascript
   uploadFile() → generateUploadUrl() → storeInConvex()
   ```

2. **Process** (`myActions.ts` - Convex action):
   ```javascript
   fetchPDF() → extractText(pdfjs) → splitText(LangChain) 
   → generateEmbeddings(Google) → storeVectors(Convex)
   ```

3. **Search** (`myActions.ts` - semanticSearch action):
   ```javascript
   embedQuery(Google) → vectorSearch(Convex) → returnResults()
   ```

## 📖 Usage

### Upload a PDF

1. Click "Upload PDF" button
2. Select PDF file
3. Edit filename if needed
4. Click "Upload"
5. Wait for processing (see toast notifications)

### Processing Steps (Automatic)

After upload, the app automatically:
- Extracts text from PDF
- Splits into ~1000 character chunks
- Generates embeddings using Google's text-embedding-004
- Stores in Convex with vector index

### Semantic Search (Coming Soon)

To search your PDFs, call the action:

```javascript
const results = await api.myActions.semanticSearch({
  query: "What is the main topic?",
  limit: 5
});
```

## 🔍 Verify It's Working

### Check Convex Dashboard

1. Go to your Convex dashboard
2. Navigate to "Data"
3. Check tables:
   - `pdfFiles` - Should show uploaded PDFs
   - `documents` - Should show chunks with embeddings

### Query from Dashboard

Run in Convex dashboard console:

```javascript
// Count documents
await ctx.db.query("documents").collect()

// Check a document structure
await ctx.db.query("documents").first()
```

### Check Logs

In Convex dashboard → Logs:
- Look for "Processing PDF: ..."
- Should see "Stored X documents in Convex"

## 🛠️ API Reference

### Convex Actions

#### `myActions.processPdfWithEmbeddings`
Process a PDF with embeddings.

```typescript
args: {
  fileUrl: string,
  fileID: string,
  fileName: string,
  createdBy: string
}
```

#### `myActions.semanticSearch`
Search using natural language.

```typescript
args: {
  query: string,
  limit?: number  // default: 5
}
```

### Convex Mutations

#### `langchain.db.addDocuments`
Bulk insert documents with embeddings.

#### `langchain.db.deleteDocumentsByFileID`
Delete all chunks for a file.

### Convex Queries

#### `langchain.db.searchSimilar`
Vector similarity search.

#### `queries.getDocumentsByFile`
Get all chunks for a specific file.

## 🐛 Troubleshooting

### "GOOGLE_API_KEY not set"
- Add `GOOGLE_API_KEY=...` to `.env.local`
- Restart Convex dev: `npx convex dev`
- Restart Next dev: `npm run dev`

### "Property 'langchain' does not exist on API"
- Run `npx convex dev` to regenerate API types
- Restart your editor/IDE

### "Failed to fetch PDF"
- Check file URL is accessible
- Verify Convex storage URL is valid
- Check network/CORS issues

### Embeddings not appearing
1. Check Convex logs for errors
2. Verify Google API key has sufficient quota
3. Check documents table in Convex dashboard
4. Look for rate limit errors

## 📊 Model Information

**Google text-embedding-004**
- Dimensions: 768
- Max input: ~2048 tokens
- Use case: Semantic search, RAG
- Rate limits: Check Google AI Studio

## 🚀 Next Steps

### Add Search UI
Create a search component:

```javascript
const SearchPdf = () => {
  const search = useMutation(api.myActions.semanticSearch);
  
  const handleSearch = async (query) => {
    const results = await search({ query, limit: 5 });
    // Display results
  };
};
```

### Add Note Taking
1. Create notes table in schema
2. Link notes to document chunks
3. Show relevant chunks when taking notes

### Improve Processing
- Add progress tracking
- Batch processing for large PDFs
- Incremental updates

## 📚 Resources

- [Convex Docs](https://docs.convex.dev)
- [Google AI for Developers](https://ai.google.dev)
- [LangChain Docs](https://js.langchain.com)
- [PDF.js](https://mozilla.github.io/pdf.js)

## 💡 Tips

- **Rate Limits**: Google embeddings have rate limits - the code includes delays
- **Chunk Size**: Adjust in `myActions.ts` (chunkSize: 1000, chunkOverlap: 200)
- **Vector Dimensions**: Must match model (768 for text-embedding-004)
- **Storage**: Each document ~3KB (text + embedding), plan accordingly

---

Built with Next.js, Convex, Google Generative AI, and LangChain 🚀
