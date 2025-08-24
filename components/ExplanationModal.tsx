import React from 'react';
import type { Alert, XAIExplanation } from '../types';
import ShapChart from './ShapChart';

interface ExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: Alert;
  explanation: XAIExplanation | null;
  loading: boolean;
}

const ModalSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="h-6 bg-gray-700/50 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-700/50 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-700/50 rounded w-5/6 mb-6"></div>
        <div className="h-6 bg-gray-700/50 rounded w-1/2 mb-4"></div>
        <div className="h-40 bg-gray-700/50 rounded-lg"></div>
    </div>
);

const ExplanationModal: React.FC<ExplanationModalProps> = ({ isOpen, onClose, alert, explanation, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300">
      <div className="material-thick rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale border-blue-500/50">
        <div className="sticky top-0 material-thick z-10 px-6 py-4 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-white">AI Explanation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <ModalSkeleton />
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">LIME: Local Explanation</h3>
                <p className="text-gray-300 leading-relaxed">{explanation?.lime_summary || "No LIME summary available."}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-blue-400 mb-4">SHAP: Feature Contribution</h3>
                {explanation && explanation.shap_values.length > 0 ? (
                  <ShapChart data={explanation.shap_values} />
                ) : (
                  <p className="text-gray-400">No SHAP values available for this prediction.</p>
                )}
              </div>

              <div className="mt-8 border-t border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-blue-400 mb-2">Alert Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div><strong className="text-gray-400">Source IP:</strong> <span className="font-mono text-white">{alert.src_ip}</span></div>
                    <div><strong className="text-gray-400">Destination IP:</strong> <span className="font-mono text-white">{alert.dst_ip}</span></div>
                    <div><strong className="text-gray-400">Protocol:</strong> <span className="text-white">{alert.protocol}</span></div>
                    <div><strong className="text-gray-400">Attack Type:</strong> <span className="text-white">{alert.attack_type}</span></div>
                </div>
                <p className="mt-4 text-sm"><strong className="text-gray-400">Description:</strong> <span className="text-gray-300">{alert.description}</span></p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplanationModal;