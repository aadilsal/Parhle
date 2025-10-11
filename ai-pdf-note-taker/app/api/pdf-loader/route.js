import { NextResponse } from "next/server";

// Note: No hardcoded PDF URL - all PDFs must be provided dynamically via URL parameter

async function extractTextFromBufferWith(pdfjs, buffer) {
    const uint8 = new Uint8Array(buffer);
    const loadingTask = pdfjs.getDocument({ data: uint8 });
    const pdfDoc = await loadingTask.promise;
    let fullText = "";
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str || "");
        fullText += strings.join(" ") + "\n";
    }
    return fullText.trim();
}

export async function GET(req) {
    try {
        
            let pdfjs;
            try {
                pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
            } catch (e) {
                console.error("Failed to load pdfjs legacy build", e);
                return NextResponse.json({ error: "pdfjs-dist legacy build not available on server" }, { status: 500 });
            }

        // PDF URL must be provided via query parameter
        const { searchParams } = new URL(req.url);
        const url = searchParams.get("url");
        
        if (!url) {
            return NextResponse.json({ 
                error: "PDF URL is required. Please provide a URL via the 'url' query parameter." 
            }, { status: 400 });
        }
        
        const resp = await fetch(url);
        if (!resp.ok) {
            return NextResponse.json({ error: `Failed to fetch ${url}: ${resp.status}` }, { status: 502 });
        }
        const arrayBuffer = await resp.arrayBuffer();
        const text = await extractTextFromBufferWith(pdfjs, arrayBuffer);

        // Dynamically import LangChain textsplitter and split the text into chunks
        const { RecursiveCharacterTextSplitter } = await import("@langchain/textsplitters");
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const docs = await splitter.createDocuments([text]);
        // Return simple array of chunks (pageContent)
        const chunks = docs.map((d) => ({ text: d.pageContent, metadata: d.metadata }));
        return NextResponse.json({ chunks });
    } catch (err) {
        console.error("PDF extraction failed", err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        // parse JSON body
        const body = await req.json();
        const url = body.url;
        const fileID = body.fileID || null;
        const createdBy = body.createdBy || null;
        
        if (!url) {
            return NextResponse.json({ 
                error: "PDF URL is required in the request body." 
            }, { status: 400 });
        }

        let pdfjs;
        try {
            pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        } catch (e) {
            console.error("Failed to load pdfjs legacy build", e);
            return NextResponse.json({ error: "pdfjs-dist legacy build not available on server" }, { status: 500 });
        }

        const resp = await fetch(url);
        if (!resp.ok) {
            return NextResponse.json({ error: `Failed to fetch ${url}: ${resp.status}` }, { status: 502 });
        }
        const arrayBuffer = await resp.arrayBuffer();
        const text = await extractTextFromBufferWith(pdfjs, arrayBuffer);

        // split text into chunks
        const { RecursiveCharacterTextSplitter } = await import("@langchain/textsplitters");
        const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
        const docs = await splitter.createDocuments([text]);
        const chunks = docs.map((d, idx) => ({
            chunkIndex: idx,
            text: d.pageContent,
            metadata: d.metadata || {},
        }));

        // Use Google Generative AI SDK to generate embeddings
        const googleKey = process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENAI_API_KEY;
        if (!googleKey) {
            return NextResponse.json({ chunks, embeddings: null, message: 'No GOOGLE_API_KEY set; chunks returned without embeddings' });
        }

        // Dynamically import Google Generative AI SDK
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(googleKey);
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

        // Generate embeddings for each chunk
        const embeddingPromises = chunks.map(async (chunk) => {
            try {
                const result = await embeddingModel.embedContent(chunk.text);
                return result.embedding.values;
            } catch (error) {
                console.error('Error generating embedding for chunk:', error);
                return null;
            }
        });

        const embeddings = await Promise.all(embeddingPromises);

        // Attach embeddings to chunks
        for (let i = 0; i < chunks.length; i++) {
            chunks[i].embedding = embeddings[i];
        }

        // Return chunks with embeddings
        return NextResponse.json({ 
            chunks, 
            embeddingsCount: embeddings.filter(e => e !== null).length,
            message: 'PDF processed successfully with embeddings'
        });

    } catch (err) {
        console.error('POST PDF processing failed', err);
        return NextResponse.json({ error: String(err) }, { status: 500 });
    }
}