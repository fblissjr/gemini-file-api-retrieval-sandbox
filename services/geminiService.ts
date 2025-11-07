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
    // FIX: The response is a Pager, which is an async iterator and does not contain
    // a `fileSearchStores` property. We need to iterate over it to get the stores.
    const response = await ai.fileSearchStores.list();
    const stores: RagStore[] = [];
    for await (const store of response) {
        stores.push({
            name: store.name,
            displayName: store.displayName || store.name.split('/').pop() || store.name,
        });
    }
    return stores;
}

export async function listDocuments(ragStoreName: string): Promise<Document[]> {
    if (!ai) throw new Error("Gemini AI not initialized");
    // FIX: The response is a Pager, which is an async iterator and does not contain
    // a `documents` property. We need to iterate over it to get the documents.
    const response = await ai.fileSearchStores.documents.list({ parent: ragStoreName });
    const documents: Document[] = [];
    for await (const file of response) {
        documents.push({
            name: file.name,
            displayName: file.displayName || file.name.split('/').pop() || file.name,
            customMetadata: file.customMetadata,
        });
    }
    return documents;
}

export async function createRagStore(displayName: string): Promise<string> {
    if (!ai) throw new Error("Gemini AI not initialized");
    const store = await ai.fileSearchStores.create({ config: { displayName } });
    if (!store.name) {
        throw new Error("Failed to create RAG store: name is missing.");
    }
    return store.name;
}

export async function uploadToRagStore(ragStoreName: string, file: File, metadata: CustomMetadata[]): Promise<void> {
    if (!ai) throw new Error("Gemini AI not initialized");
    
    let operation = await ai.fileSearchStores.uploadToFileSearchStore({
        fileSearchStoreName: ragStoreName,
        file: file,
        config: {
            displayName: file.name,
            customMetadata: metadata.length > 0 ? metadata : undefined,
        }
    });

    // Wait until import is complete by polling the operation status.
    while (operation && !operation.done) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
        operation = await ai.operations.get({ operation: operation });
    }
}

export async function deleteDocument(ragStoreName: string, docName: string): Promise<void> {
    if (!ai) throw new Error("Gemini AI not initialized");
    await ai.fileSearchStores.documents.delete({
        name: docName,
        config: {
            force: true, // Also delete underlying chunks and related objects.
        }
    });
}

export async function fileSearch(ragStoreName: string, query: string): Promise<QueryResult> {
    if (!ai) throw new Error("Gemini AI not initialized");
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: query }] }],
        config: {
            safetySettings: safetySettings,
            tools: [
                {
                    fileSearch: {
                        fileSearchStoreNames: [ragStoreName]
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
    // FIX: The `force` parameter was causing a type error. It must be nested
    // within a `config` object for this API call.
    await ai.fileSearchStores.delete({
        name: ragStoreName,
        config: {
            force: true,
        },
    });
}