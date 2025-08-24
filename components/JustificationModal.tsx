import React, { useState } from 'react';

interface JustificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title: string;
  message: string;
}

const JustificationModal: React.FC<JustificationModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading(true);
    await onConfirm(reason);
    // The parent component is responsible for closing the modal and resetting state
    setLoading(false);
    setReason('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="material-thick rounded-lg w-full max-w-md mx-4 p-6 transform transition-all duration-300 scale-95 opacity-0 animate-fade-in-scale">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        <p className="mt-2 text-gray-300">{message}</p>
        <form onSubmit={handleSubmit} className="mt-4">
          <div>
            <label htmlFor="justification" className="block text-sm font-medium text-gray-300">Reason for this action (Required)</label>
            <textarea
              id="justification"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              className="w-full px-3 py-2 mt-1 text-white bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Responding to security incident #1234. User requested role change."
            />
          </div>
          <div className="mt-6 flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reason.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm Action'}
            </button>
          </div>
        </form>
      </div>
       <style>{`
        @keyframes fade-in-scale {
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in-scale { animation: fade-in-scale 0.2s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default JustificationModal;