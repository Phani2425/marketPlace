
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FaCloudUploadAlt, FaTrash } from 'react-icons/fa';

interface Props {
  onChange: (files: File[]) => void;
  maxFiles?: number;
  preview?: string[];
  error?: string;
}

const DragDropImageUpload: React.FC<Props> = ({ 
  onChange, 
  maxFiles = 5,
  preview = [],
  error
}) => {
  const [rejectedFiles, setRejectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[], rejected: any[]) => {
    onChange(acceptedFiles);
    setRejectedFiles(rejected.map(r => r.file));
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles,
    maxSize: 5242880 // 5MB
  });

  return (
    <div className="image-upload-container">
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive ? 'active' : ''}`}
      >
        <input {...getInputProps()} />
        <FaCloudUploadAlt className="upload-icon" />
        <p>Drag & drop images here, or click to select</p>
        <span>Maximum {maxFiles} images (5MB each)</span>
      </div>

      {error && <p className="error-message">{error}</p>}
      
      {rejectedFiles.length > 0 && (
        <div className="rejected-files">
          <p>Rejected files:</p>
          {rejectedFiles.map((file, index) => (
            <span key={index}>{file.name} - Invalid file</span>
          ))}
        </div>
      )}

      {preview.length > 0 && (
        <div className="preview-grid">
          {preview.map((url, index) => (
            <div key={index} className="preview-item">
              <img src={url} alt={`Preview ${index + 1}`} />
              <button 
                type="button" 
                onClick={() => {
                  const newPreview = [...preview];
                  newPreview.splice(index, 1);
                  onChange([]);
                }}
                className="remove-btn"
              >
                <FaTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DragDropImageUpload;