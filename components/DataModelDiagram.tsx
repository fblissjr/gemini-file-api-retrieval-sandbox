/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RagStore, Document } from '../types';
import StoreIcon from './icons/StoreIcon';
import DocumentIcon from './icons/DocumentIcon';

interface DataModelDiagramProps {
    store: RagStore;
    documents: Document[];
}

const DataModelDiagram: React.FC<DataModelDiagramProps> = ({ store, documents }) => {
    return (
        <div>
            <h3 className="text-lg font-semibold text-gem-teal mb-4">RAG Store Data Model</h3>
            <p className="text-sm text-gem-offwhite/80 mb-6">
                Here's a simplified view of how your uploaded files are structured within the RAG store for efficient querying.
            </p>

            {/* Store container */}
            <div className="bg-gem-mist/20 border border-gem-mist/30 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-4">
                    <StoreIcon />
                    <span className="text-lg font-bold text-gem-offwhite truncate" title={store.displayName}>
                        {store.displayName}
                    </span>
                </div>

                <div className="pl-4 border-l-2 border-gem-mist/50 space-y-4">
                    {documents.length > 0 ? (
                        documents.map(doc => (
                            // Document container
                            <div key={doc.name} className="bg-gem-slate/50 p-3 rounded-md border border-gem-mist/20">
                                <div className="flex items-center space-x-2">
                                    <DocumentIcon />
                                    <p className="font-semibold truncate" title={doc.displayName}>
                                        {doc.displayName}
                                    </p>
                                </div>
                                {/* Conceptual Chunks */}
                                <div className="flex flex-wrap gap-2 mt-3 pl-7">
                                    <span className="bg-gem-mist text-gem-offwhite text-xs px-2 py-1 rounded">Chunk 1</span>
                                    <span className="bg-gem-mist text-gem-offwhite text-xs px-2 py-1 rounded">Chunk 2</span>
                                    <span className="bg-gem-mist text-gem-offwhite text-xs px-2 py-1 rounded">...</span>
                                    <span className="bg-gem-mist text-gem-offwhite text-xs px-2 py-1 rounded">Chunk N</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gem-offwhite/60 pl-2">No documents in this store yet. Upload one to see it here.</p>
                    )}
                </div>
            </div>
            
            <div className="mt-6">
                <h4 className="font-semibold text-gem-teal mb-2">How it Works</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gem-offwhite/80">
                    <li><strong>Upload:</strong> You upload your raw source documents (PDF, TXT, etc.) into a RAG Store.</li>
                    <li><strong>Processing & Chunking:</strong> The File API automatically processes and divides each document into smaller, manageable 'chunks' of text. This is crucial for retrieval.</li>
                    <li><strong>Storage:</strong> These chunks are stored and indexed in a way that's optimized for semantic search.</li>
                    <li><strong>Querying:</strong> When you ask a question, the system finds the most relevant chunks from your documents to construct an accurate answer, citing the sources.</li>
                </ol>
            </div>
        </div>
    );
};

export default DataModelDiagram;
