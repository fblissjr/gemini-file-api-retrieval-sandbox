/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" 
            role="dialog" 
            aria-modal="true" 
            aria-labelledby="info-modal-title"
            onClick={onClose}
        >
            <div 
                className="bg-gem-slate p-6 rounded-lg shadow-xl w-full max-w-lg"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <h3 id="info-modal-title" className="text-xl font-bold mb-4">About RAG Stores</h3>
                
                <div className="space-y-4 text-gem-offwhite/90">
                    <p>
                        <strong>Where is my data stored?</strong>
                    </p>
                    <p>
                        Your RAG Stores and the documents you upload are{' '}
                        <strong>securely stored and managed on Google's cloud infrastructure</strong>.
                        They are not stored locally in your browser.
                    </p>
                    <p>
                        This ensures that your data is persistent, scalable, and accessible whenever you use this application
                        with your API key. When you delete a store or a document through this interface, it is permanently
                        removed from Google's servers.
                    </p>
                </div>
                
                <div className="flex justify-end mt-6">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 rounded-md bg-gem-blue hover:bg-blue-500 text-white transition-colors"
                        title="Close this window"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InfoModal;
