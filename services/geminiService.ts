/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { RagStore, Document, QueryResult, CustomMetadata } from '../types';

let ai: GoogleGenAI;

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
    },
];


export function initialize() {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export async function listRagStores(): Promise<RagStore[]> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // FIX: The `corpora` API is deprecated. Use `ai.rag.listCorpora` instead.
    const response = await ai.rag.listCorpora();
    const corpora = response.corpora || [];
    const stores: RagStore[] = corpora.map(corpus => ({
        name: corpus.name,
        displayName: corpus.displayName || corpus.name.split('/').pop() || corpus.name,
    }));
    return stores;
}

export async function listDocuments(ragStoreName: string): Promise<Document[]> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // FIX: The `corpora` API is deprecated. Use `ai.rag.listDocuments` instead.
    const response = await ai.rag.listDocuments({ parent: ragStoreName });
    const files = response.documents || [];
    const documents: Document[] = files.map(file => ({
        name: file.name,
        displayName: file.displayName || file.name.split('/').pop() || file.name,
        customMetadata: file.customMetadata,
    }));
    return documents;
}

export async function createRagStore(displayName: string): Promise<string> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // FIX: The `corpora` API is deprecated. Use `ai.rag.createCorpus` instead.
    const corpus = await ai.rag.createCorpus({ displayName });
    if (!corpus.name) {
        throw new Error("Failed to create RAG store: name is missing.");
    }
    return corpus.name;
}

export async function uploadToRagStore(ragStoreName: string, file: File, metadata: CustomMetadata[]): Promise<void> {
    if (!ai) throw new Error("Gemini AI not initialized");
    
    // 1. Upload the file to the File Service.
    // FIX: Corrected the call to `ai.files.upload` to pass the file object directly.
    const uploadResponse = await ai.files.upload(file);

    const uploadedFile = uploadResponse.file;

    if (!uploadedFile || !uploadedFile.uri) {
        throw new Error("File upload did not return a valid file resource with a URI.");
    }

    // 2. Link the uploaded file to the corpus by creating a Document in the corpus.
    // FIX: The `corpora` API is deprecated. Use `ai.rag.createDocument` instead.
    await ai.rag.createDocument({
        parent: ragStoreName,
        document: { 
            name: `corpora/${ragStoreName.split('/')[1]}/documents/${uploadedFile.name.split('/')[1]}`,
            displayName: file.name,
            customMetadata: metadata.length > 0 ? metadata : undefined,
        },
    });
}

export async function deleteDocument(ragStoreName: string, docName: string): Promise<void> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // The docName is the full resource path from the list call.
    // FIX: The `corpora` API is deprecated. Use `ai.rag.deleteDocument` instead.
    await ai.rag.deleteDocument({
        name: docName,
    });
}

export async function fileSearch(ragStoreName: string, query: string): Promise<QueryResult> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // FIX: `safetySettings` and `tools` must be properties of a `config` object.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: query }] }],
        config: {
            safetySettings: safetySettings,
            tools: [
                {
                    retrieval: {
                        source: {
                           corpus: ragStoreName,
                        }
                    }
                }
            ]
        }
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
        text: response.text,
        groundingChunks: groundingChunks,
    };
}

export async function deleteRagStore(ragStoreName: string): Promise<void> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // FIX: The `corpora` API is deprecated. Use `ai.rag.deleteCorpus` instead.
    await ai.rag.deleteCorpus({
        name: ragStoreName,
        force: true,
    });
}
