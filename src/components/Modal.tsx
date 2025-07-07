import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-gray-900 opacity-40" onClick={onClose}></div>
        <div className="relative bg-gray-700 rounded-lg shadow-xl max-w-lg w-full">
          {title && (
            <div className="px-6 py-4 border-b border-gray-600">
              <h3 className="text-lg font-medium text-gray-50">{title}</h3>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal; 