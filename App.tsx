/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { RagStore, Document, QueryResult, CustomMetadata } from './types';
import * as geminiService from './services/geminiService';
import Spinner from './components/Spinner';
import RagStoreList from './components/RagStoreList';
import DocumentList from './components/DocumentList';
import QueryInterface from './components/QueryInterface';

const App: React.FC = () => {
    const [stores, setStores] = useState<RagStore[]>([]);
    const [selectedStore, setSelectedStore] = useState<RagStore | null>(null);
    const [documents, setDocuments] = useState<Document[]>([]);
    const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
    const [isLoadingStores, setIsLoadingStores] = useState(false);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [isQuerying, setIsQuerying] = useState(false);
    const [processingFile, setProcessingFile] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [initialized, setInitialized] = useState(false);

    const handleError = (message: string, err?: any) => {
        console.error(message, err);
        const errorMessage = err ? (err instanceof Error ? err.message : String(err)) : '';
        setError(`${message}${errorMessage ? `: ${errorMessage}` : ''}`);
    };
    
    const clearError = () => {
        setError(null);
        // Attempt to re-initialize after clearing an error
        if (!initialized) {
            loadStores();
        }
    };
    
    const loadStores = useCallback(async () => {
        setIsLoadingStores(true);
        setError(null);
        try {
            geminiService.initialize();
            const fetchedStores = await geminiService.listRagStores();
            setStores(fetchedStores);
            setInitialized(true);
        } catch (err) {
            handleError("Failed to load RAG stores. Please ensure your API key is valid and has permissions.", err);
        } finally {
            setIsLoadingStores(false);
        }
    }, []);

    useEffect(() => {
        if (!initialized) {
            loadStores();
        }
    }, [initialized, loadStores]);

    const handleCreateStore = async (displayName: string) => {
        setIsLoadingStores(true);
        try {
            await geminiService.createRagStore(displayName);
            await loadStores();
        } catch (err) {
            handleError("Failed to create store", err);
            setIsLoadingStores(false);
        }
    };

    const handleDeleteStore = async (storeName: string) => {
        if (!window.confirm("Are you sure you want to delete this store and all its documents? This action cannot be undone.")) return;
        setIsLoadingStores(true);
        try {
            await geminiService.deleteRagStore(storeName);
            if (selectedStore?.name === storeName) {
                setSelectedStore(null);
                setDocuments([]);
            }
            await loadStores();
        } catch (err) {
            handleError("Failed to delete store", err);
            setIsLoadingStores(false);
        }
    };

    const handleSelectStore = async (store: RagStore) => {
        if (selectedStore?.name === store.name) return;
        setSelectedStore(store);
        setDocuments([]);
        setQueryResult(null);
        setIsLoadingDocuments(true);
        try {
            const fetchedDocs = await geminiService.listDocuments(store.name);
            setDocuments(fetchedDocs);
        } catch (err) {
            handleError(`Failed to load documents for ${store.displayName}`, err);
        } finally {
            setIsLoadingDocuments(false);
        }
    };
    
    const handleUploadDocument = async (file: File, metadata: CustomMetadata[]) => {
        if (!selectedStore) return;
        setProcessingFile(file.name);
        try {
            await geminiService.uploadToRagStore(selectedStore.name, file, metadata);
            const fetchedDocs = await geminiService.listDocuments(selectedStore.name);
            setDocuments(fetchedDocs);
        } catch (err) {
            handleError(`Failed to upload ${file.name}`, err);
        } finally {
            setProcessingFile(null);
        }
    };

    const handleDeleteDocument = async (docName: string) => {
        if (!selectedStore) return;
        const docDisplayName = documents.find(d => d.name === docName)?.displayName || 'document';
        setProcessingFile(docDisplayName);
        try {
            await geminiService.deleteDocument(selectedStore.name, docName);
            const fetchedDocs = await geminiService.listDocuments(selectedStore.name);
            setDocuments(fetchedDocs);
        } catch (err) {
            handleError(`Failed to delete ${docDisplayName}`, err);
        } finally {
            setProcessingFile(null);
        }
    };

    const handleQuery = async (query: string) => {
        if (!selectedStore) return;
        setIsQuerying(true);
        setQueryResult(null);
        try {
            const result = await geminiService.fileSearch(selectedStore.name, query);
            setQueryResult(result);
        } catch (err) {
            handleError('Failed to execute query', err);
        } finally {
            setIsQuerying(false);
        }
    };

    const renderContent = () => {
        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-screen bg-red-900/20 text-red-300 p-4">
                    <h1 className="text-3xl font-bold mb-4">Application Error</h1>
                    <p className="max-w-md text-center mb-4">{error}</p>
                    <button onClick={clearError} className="px-4 py-2 rounded-md bg-gem-mist hover:bg-gem-mist/70 transition-colors text-gem-offwhite" title="Try Again">
                       Try Again
                    </button>
                </div>
            );
        }

        if (!initialized) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <Spinner /> <span className="ml-4 text-xl">Loading RAG Stores...</span>
                </div>
            );
        }

        return (
             <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 h-full">
                <div className="col-span-1 p-4 border-r border-gem-mist overflow-y-auto bg-gem-slate/50">
                     <RagStoreList 
                        stores={stores}
                        selectedStore={selectedStore}
                        isLoading={isLoadingStores}
                        onCreate={handleCreateStore}
                        onSelect={handleSelectStore}
                        onDelete={handleDeleteStore}
                        onRefresh={loadStores}
                    />
                </div>
                <div className="col-span-1 lg:border-r border-gem-mist overflow-y-auto p-4">
                    <DocumentList 
                        selectedStore={selectedStore}
                        documents={documents}
                        isLoading={isLoadingDocuments}
                        processingFile={processingFile}
                        onUpload={handleUploadDocument}
                        onDelete={handleDeleteDocument}
                    />
                </div>
                <div className="col-span-1 lg:col-span-1 xl:col-span-2 p-4 overflow-y-auto">
                     <QueryInterface 
                        selectedStore={selectedStore}
                        documents={documents}
                        isLoading={isQuerying}
                        result={queryResult}
                        onQuery={handleQuery}
                    />
                </div>
            </div>
        );
    };

    return (
        <main className="h-screen bg-gem-onyx text-gem-offwhite font-sans">
            {renderContent()}
        </main>
    );
};

export default App;