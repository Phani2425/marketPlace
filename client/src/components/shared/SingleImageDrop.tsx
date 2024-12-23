// src/components/shared/SingleImageDrop.tsx
import React, {  useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaTrash } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onChange: (file: File | null) => void;
  preview?: string | null;
  label: string;
  accept?: string;
}

const SingleImageDrop: React.FC<Props> = ({ 
  onChange, 
  preview,
  label,
  accept = "image/*"
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onChange(acceptedFiles[0]);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { [accept]: [] },
    maxFiles: 1,
    multiple: false
  });

  return (
    <div className="single-image-upload">
      <label>{label}</label>
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''} ${preview ? 'has-preview' : ''}`}
      >
        <input {...getInputProps()} />
        
        <AnimatePresence>
          {preview ? (
            <motion.div 
              className="preview-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <img src={preview} alt={`${label} Preview`} />
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="remove-btn"
              >
                <FaTrash />
              </button>
            </motion.div>
          ) : (
            <motion.div 
              className="upload-prompt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <FaCloudUploadAlt className="upload-icon" />
              <p>Drag & drop image here or click to browse</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SingleImageDrop;