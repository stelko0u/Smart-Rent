import React from 'react';
import Modal from 'react-modal';

interface DeleteCarModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

if (typeof window !== 'undefined') {
  Modal.setAppElement('body');
}

export default function DeleteCarModal({
  onConfirm,
  onCancel,
}: DeleteCarModalProps) {
  return (
    <Modal
      isOpen={true}
      onRequestClose={onCancel}
      contentLabel="Delete Car Confirmation"
      className="bg-white rounded-lg py-3 px-6 max-w-lg w-full relative z-50 flex items-center justify-center"
      overlayClassName="fixed inset-0 bg-black/50 z-40 flex items-center justify-center"
    >
      <div>
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Confirm Delete
        </h2>
        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this car? This action cannot be
          undone.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </Modal>
  );
}
