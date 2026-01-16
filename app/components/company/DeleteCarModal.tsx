'use client';

import React from 'react';
import Modal from 'react-modal';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteCarModal({ isOpen, onClose, onConfirm }: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Confirm delete"
      overlayClassName="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
      style={{
        overlay: {
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        },
      }}
      className="bg-white/80 rounded-xl p-6 w-full max-w-lg shadow-xl outline-none"
    >
      <p className="text-lg">
        Are you sure you want to delete this car? This action cannot be undone.
      </p>

      <div className="mt-4 flex justify-end gap-2">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>
          Cancel
        </button>
        <button className="px-3 py-1 bg-red-600 text-white rounded hover:shadow-lg ">
          Delete
        </button>
      </div>
    </Modal>
  );
}
