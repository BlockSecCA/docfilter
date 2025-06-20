import React, { useState, useRef } from 'react';
import './DropZone.css';

interface DropZoneProps {
  onArtifactProcessed: () => void;
}

function DropZone({ onArtifactProcessed }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) {
      await processFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        await window.electronAPI.processArtifact({
          type: 'file',
          content: content,
          source: file.name,
        });
        onArtifactProcessed();
      };
      
      if (file.type.startsWith('text/') || file.name.endsWith('.txt')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setIsProcessing(true);
    try {
      await window.electronAPI.processArtifact({
        type: 'url',
        content: urlInput,
        source: urlInput,
      });
      setUrlInput('');
      onArtifactProcessed();
    } catch (error) {
      console.error('Error processing URL:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="drop-zone-container">
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${isProcessing ? 'processing' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
          style={{ display: 'none' }}
        />
        
        {isProcessing ? (
          <div className="processing">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        ) : (
          <div className="drop-content">
            <div className="drop-icon">📄</div>
            <p>Drop files here or click to select</p>
            <span className="supported-formats">PDF, DOCX, TXT, Images</span>
          </div>
        )}
      </div>

      <form onSubmit={handleUrlSubmit} className="url-form">
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="Enter URL to analyze..."
          disabled={isProcessing}
        />
        <button type="submit" disabled={isProcessing || !urlInput.trim()}>
          Analyze URL
        </button>
      </form>
    </div>
  );
}

export default DropZone;