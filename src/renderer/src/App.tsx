import React, { useState } from 'react';
import Header from './components/Header';
import DropZone from './components/DropZone';
import Inbox from './components/Inbox';
import DetailPane from './components/DetailPane';
import ConfigModal from './components/ConfigModal';
import './App.css';

interface Artifact {
  id: string;
  type: string;
  source: string;
  extracted_content?: string;
  ai_recommendation?: string;
  ai_summary?: string;
  ai_reasoning?: string;
  provider?: string;
  model?: string;
  created_at: string;
  was_truncated?: number;
}

function App() {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [refreshInbox, setRefreshInbox] = useState(0);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem('leftPanelWidth');
    return saved ? parseInt(saved, 10) : 400;
  });
  const [isResizing, setIsResizing] = useState(false);

  const handleArtifactProcessed = () => {
    setRefreshInbox(prev => prev + 1);
  };

  const handleArtifactSelect = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing) return;
    
    const newWidth = e.clientX;
    const minWidth = 300;
    const maxWidth = window.innerWidth * 0.7; // Max 70% of screen width
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setLeftPanelWidth(newWidth);
      localStorage.setItem('leftPanelWidth', newWidth.toString());
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
  };

  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Listen for artifact events from main process
  React.useEffect(() => {
    const handleArtifactAdded = (artifactId: string) => {
      console.log('Artifact added from browser integration:', artifactId);
      setRefreshInbox(prev => prev + 1);
    };

    const handleArtifactUpdated = (artifactId: string) => {
      console.log('Artifact updated:', artifactId);
      setRefreshInbox(prev => prev + 1);
      // If the updated artifact is currently selected, refresh the selection
      if (selectedArtifact && selectedArtifact.id === artifactId) {
        // Re-fetch the updated artifact
        window.electronAPI.getArtifact(artifactId).then(updatedArtifact => {
          setSelectedArtifact(updatedArtifact);
        });
      }
    };

    window.electronAPI.onArtifactAdded(handleArtifactAdded);
    window.electronAPI.onArtifactUpdated(handleArtifactUpdated);
  }, [selectedArtifact]);

  return (
    <div className="app">
      <Header onConfigClick={() => setShowConfig(true)} />
      
      <div className="main-content">
        <div 
          className="left-panel"
          style={{ width: `${leftPanelWidth}px` }}
        >
          <DropZone onArtifactProcessed={handleArtifactProcessed} />
          <Inbox 
            onArtifactSelect={handleArtifactSelect}
            refreshTrigger={refreshInbox}
          />
        </div>
        
        <div 
          className={`resize-handle ${isResizing ? 'resizing' : ''}`}
          onMouseDown={handleMouseDown}
        />
        
        <div 
          className="right-panel"
          style={{ width: `calc(100% - ${leftPanelWidth}px - 4px)` }}
        >
          <DetailPane 
            artifact={selectedArtifact} 
            onArtifactUpdated={handleArtifactProcessed}
          />
        </div>
      </div>

      {showConfig && (
        <ConfigModal onClose={() => setShowConfig(false)} />
      )}
    </div>
  );
}

export default App;