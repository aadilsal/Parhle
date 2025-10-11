"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { api } from "./_generated/api";

/**
 * Process PDF: fetch, extract text, split into chunks, generate embeddings, and store
 */
export const processPdfWithEmbeddings = action({
  args: {
    fileUrl: v.string(),
    fileID: v.string(),
    fileName: v.string(),
    createdBy: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check for Google API key
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set");
      }

      console.log(`Processing PDF: ${args.fileName} (${args.fileID})`);

      // Step 1 & 2: Use Next.js API route to extract text (pdfjs-dist doesn't work in Convex)
      // The API route handles PDF fetching and text extraction
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      const pdfLoaderResponse = await fetch(`${apiUrl}/api/pdf-loader`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: args.fileUrl,
          fileID: args.fileID,
          createdBy: args.createdBy,
        }),
      });

      if (!pdfLoaderResponse.ok) {
        const errorData = await pdfLoaderResponse.json();
        throw new Error(`PDF extraction failed: ${errorData.error || pdfLoaderResponse.statusText}`);
      }

      const pdfData = await pdfLoaderResponse.json();
      const chunks = pdfData.chunks;
      
      if (!chunks || chunks.length === 0) {
        throw new Error("No text chunks extracted from PDF");
      }

      console.log(`Extracted ${chunks.length} chunks from PDF`);
      
      // Reconstruct full text from chunks for logging
      const extractedText = chunks.map((c: any) => c.text).join("\n");
      console.log(`Total text length: ${extractedText.length} characters`);

      if (!extractedText || extractedText.length < 10) {
        throw new Error("No meaningful text extracted from PDF");
      }

      // Step 3: Chunks are already created by the API route
      // No need to split again, use the chunks directly
      console.log(`Using ${chunks.length} pre-split chunks`);

      // Step 4: Generate embeddings using Google Generative AI
      const genAI = new GoogleGenerativeAI(googleApiKey);
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

      const documentsWithEmbeddings = [];
      
      // Process chunks in batches to avoid rate limits
      const batchSize = 5;
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        
        const embeddingPromises = batch.map(async (chunk: any, idx: number) => {
          try {
            const result = await embeddingModel.embedContent(chunk.text);
            return {
              text: chunk.text,
              embedding: result.embedding.values,
              metadata: {
                fileID: args.fileID,
                fileName: args.fileName,
                createdBy: args.createdBy,
                chunkIndex: i + idx,
                chunkSize: chunk.text.length,
                ...chunk.metadata,
              },
            };
          } catch (error) {
            console.error(`Error embedding chunk ${i + idx}:`, error);
            throw error;
          }
        });

        const batchResults = await Promise.all(embeddingPromises);
        documentsWithEmbeddings.push(...batchResults);
        
        console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
        
        // Small delay between batches to respect rate limits
        if (i + batchSize < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Generated ${documentsWithEmbeddings.length} embeddings`);

      // Step 5: Store embeddings in Convex documents table
      const result = await ctx.runMutation(api.langchain.db.addDocuments, {
        documents: documentsWithEmbeddings,
      });

      console.log(`Stored ${result.count} documents in Convex`);

      return {
        success: true,
        fileID: args.fileID,
        fileName: args.fileName,
        chunksProcessed: chunks.length,
        embeddingsStored: result.count,
        message: `Successfully processed ${args.fileName}: ${chunks.length} chunks, ${result.count} embeddings stored`,
      };

    } catch (error: any) {
      console.error("Error processing PDF:", error);
      return {
        success: false,
        error: error.message || String(error),
        fileID: args.fileID,
      };
    }
  },
});

/**
 * Search for similar content using a text query
 */
export const semanticSearch = action({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    fileID: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set");
      }

      // Generate embedding for the query
      const genAI = new GoogleGenerativeAI(googleApiKey);
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const result = await embeddingModel.embedContent(args.query);
      const queryEmbedding = result.embedding.values;

      // Search for similar documents
      const results = await ctx.runQuery(api.langchain.db.searchSimilar, {
        embedding: queryEmbedding,
        limit: args.limit || 5,
      });

      // Filter by fileID if provided
      const filteredResults = args.fileID
        ? results.filter((r: any) => r.metadata?.fileID === args.fileID)
        : results;

      return {
        success: true,
        query: args.query,
        results: filteredResults,
      };

    } catch (error: any) {
      console.error("Error in semantic search:", error);
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  },
});

/**
 * Chat with RAG - Answer questions using PDF context
 */
export const chatWithPdf = action({
  args: {
    question: v.string(),
    fileID: v.optional(v.string()),
    conversationHistory: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    try {
      const googleApiKey = process.env.GOOGLE_API_KEY;
      if (!googleApiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is not set");
      }

      const genAI = new GoogleGenerativeAI(googleApiKey);

      // Step 1: Search for relevant context
      const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
      const embeddingResult = await embeddingModel.embedContent(args.question);
      const questionEmbedding = embeddingResult.embedding.values;

      const searchResults = await ctx.runQuery(api.langchain.db.searchSimilar, {
        embedding: questionEmbedding,
        limit: 3,
      });

      // Filter by fileID if provided
      const relevantDocs = args.fileID
        ? searchResults.filter((r: any) => r.metadata?.fileID === args.fileID)
        : searchResults;

      // Step 2: Build context from relevant documents
      let context = "";
      if (relevantDocs.length > 0) {
        context = "\nRelevant context from the PDF:\n\n";
        relevantDocs.forEach((doc: any, idx: number) => {
          context += `[Context ${idx + 1}]: ${doc.text}\n\n`;
        });
      }

      // Step 3: Build enhanced educational prompt with strict guidelines
      let prompt = `You are an expert AI tutor designed to help students learn effectively. Your role is to provide accurate, clear, and educational responses.

IMPORTANT RULES:
1. ONLY use information from the provided context below. DO NOT make up or assume information.
2. If the context doesn't contain the answer, say: "I cannot find this information in the document."
3. Provide step-by-step explanations when teaching concepts.
4. Use simple, clear language appropriate for students.
5. Break down complex topics into understandable parts.
6. When explaining, use examples from the document when available.
7. Always cite which part of the document you're using (e.g., "According to the document...").
8. If you're uncertain, acknowledge it rather than guessing.

${context}

`;

      if (args.conversationHistory && args.conversationHistory.length > 0) {
        prompt += "Previous conversation for context:\n";
        args.conversationHistory.slice(-3).forEach((msg: any) => {
          prompt += `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}\n`;
        });
        prompt += "\n";
      }

      prompt += `Student's Question: ${args.question}

Instructions for your response:
- Start with a direct answer to the question
- Explain the reasoning or concept step-by-step
- Use specific examples or quotes from the context
- Keep explanations clear and concise
- If the question requires information not in the context, explicitly state that
- End with a brief summary or key takeaway when appropriate

Your educational response:`;

      // Step 4: Generate answer using Gemini with optimal settings for education
      const chatModel = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",  // Free tier model (was gemini-pro which is deprecated)
        generationConfig: {
          temperature: 0.3,          // Lower temperature for more factual, consistent responses
          topK: 20,                  // Limit vocabulary for more focused responses
          topP: 0.8,                 // Nucleus sampling for quality
          maxOutputTokens: 1024,     // Reasonable length for educational responses
        },
      });
      
      const result = await chatModel.generateContent(prompt);
      const response = await result.response;
      const answer = response.text();
      
      // Validate response quality
      const answerLower = answer.toLowerCase();
      const hasUncertaintyPhrases = 
        answerLower.includes("cannot find") ||
        answerLower.includes("not mentioned") ||
        answerLower.includes("don't have information") ||
        answerLower.includes("according to");
      
      // Check if response seems to be based on context
      const seemsGrounded = relevantDocs.length === 0 || hasUncertaintyPhrases || 
        answer.length > 50; // Reasonable length indicates thought-out response

      return {
        success: true,
        answer,
        question: args.question,
        contextUsed: relevantDocs.length,
        sources: relevantDocs.map((doc: any) => ({
          fileName: doc.metadata?.fileName,
          chunkIndex: doc.metadata?.chunkIndex,
        })),
      };

    } catch (error: any) {
      console.error("Error in chat:", error);
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  },
});
