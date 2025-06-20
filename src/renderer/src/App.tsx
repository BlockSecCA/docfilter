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
  ai_reasoning?: string;
  provider?: string;
  model?: string;
  created_at: string;
}

function App() {
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [refreshInbox, setRefreshInbox] = useState(0);

  const handleArtifactProcessed = () => {
    setRefreshInbox(prev => prev + 1);
  };

  const handleArtifactSelect = (artifact: Artifact) => {
    setSelectedArtifact(artifact);
  };

  return (
    <div className="app">
      <Header onConfigClick={() => setShowConfig(true)} />
      
      <div className="main-content">
        <div className="left-panel">
          <DropZone onArtifactProcessed={handleArtifactProcessed} />
          <Inbox 
            onArtifactSelect={handleArtifactSelect}
            refreshTrigger={refreshInbox}
          />
        </div>
        
        <div className="right-panel">
          <DetailPane artifact={selectedArtifact} />
        </div>
      </div>

      {showConfig && (
        <ConfigModal onClose={() => setShowConfig(false)} />
      )}
    </div>
  );
}

export default App;