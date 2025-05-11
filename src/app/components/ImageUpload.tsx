'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  onUpload: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ onUpload, className = '' }: ImageUploadProps) {
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const file = acceptedFiles[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onUpload(data.url);
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.gif', '.jpeg', '.jpg']
    },
    maxFiles: 1,
    multiple: false
  });

  return (    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-lg p-4 cursor-pointer 
        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors 
        ${isDragActive 
          ? 'border-green-500 bg-green-50/10 dark:border-green-400 dark:bg-green-400/10' 
          : 'border-gray-300 dark:border-gray-600'
        } ${className}`}
    >
      <input {...getInputProps()} role="file-input" />
      {isDragActive ? (
        <p className="text-center text-gray-600 dark:text-gray-400">Drop the image here</p>
      ) : (
        <p className="text-center text-gray-600 dark:text-gray-400">
          Drag & drop an image here, or click to select
        </p>
      )}
    </div>
  );
}
