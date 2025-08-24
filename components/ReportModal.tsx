import React from 'react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportContent: string;
}

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, reportContent }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 transition-opacity duration-300">
      <div className="material-ultra-thick rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">AI-Generated Incident Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div id="printable-report" className="p-6 overflow-y-auto">
            <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: reportContent.replace(/\n/g, '<br />') }}
            />
        </div>
        <div className="px-6 py-4 border-t border-gray-700 mt-auto flex justify-end gap-4">
            <button onClick={handlePrint} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                Print Report
            </button>
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
          .animate-fade-in-scale { animation: fade-in-scale 0.3s ease-out forwards; }
        `}</style>
    </div>
  );
};

export default ReportModal;