import React from 'react';
import type { EvidenceFile } from '../types';

interface EvidenceViewerModalProps {
  evidence: EvidenceFile;
  onClose: () => void;
}

const EvidenceViewerModal: React.FC<EvidenceViewerModalProps> = ({ evidence, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 animate-fade-in-scale">
      <div className="material-ultra-thick rounded-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white font-mono">{evidence.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto">
          <pre className="bg-gray-900/70 p-4 rounded-lg text-sm text-gray-300 whitespace-pre-wrap">
            <code>{evidence.content}</code>
          </pre>
        </div>
         <div className="px-6 py-4 border-t border-gray-700 mt-auto flex justify-end">
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-lg">
                Close
            </button>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-scale {
          0% { opacity: 0; transform: scale(.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default EvidenceViewerModal;
