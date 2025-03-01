'use client';

import React from 'react';

interface EditButtonProps {
  gridId: string;
  isLeased: boolean;
  onEditClick: (gridId: string) => void;
}

export const EditButton: React.FC<EditButtonProps> = ({
  gridId,
  isLeased,
  onEditClick,
}) => {
  if (!isLeased) return null;

  return (
    <button
      className="edit-grid-btn absolute top-2 right-2 bg-blue-500 hover:bg-blue-600 hover:text-white text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
      onClick={() => onEditClick(gridId)}
      aria-label="Edit grid content"
    >
      Edit Grid
    </button>
  );
};

export default EditButton; 