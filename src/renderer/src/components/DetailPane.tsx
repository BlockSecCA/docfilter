import React from 'react';
import './DetailPane.css';

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

interface DetailPaneProps {
  artifact: Artifact | null;
}

function DetailPane({ artifact }: DetailPaneProps) {
  if (!artifact) {
    return (
      <div className="detail-pane empty">
        <div className="empty-message">
          <div className="empty-icon">📋</div>
          <h3>Select an artifact</h3>
          <p>Choose an item from the inbox to view details</p>
        </div>
      </div>
    );
  }

  const getRecommendationClass = (recommendation?: string) => {
    if (!recommendation) return 'pending';
    return recommendation.toLowerCase() === 'read' ? 'read' : 'discard';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReprocess = async () => {
    try {
      await window.electronAPI.reprocessArtifact(artifact.id);
      // Note: In a real app, you'd want to refresh the data here
    } catch (error) {
      console.error('Error reprocessing artifact:', error);
    }
  };

  const openSource = () => {
    if (artifact.type === 'url') {
      window.open(artifact.source, '_blank');
    }
  };

  return (
    <div className="detail-pane">
      <div className="detail-header">
        <div className="source-info">
          <h2>{artifact.source}</h2>
          <div className="meta-info">
            <span className="type-badge">{artifact.type.toUpperCase()}</span>
            <span className="date">{formatDate(artifact.created_at)}</span>
            {artifact.type === 'url' && (
              <button className="open-source" onClick={openSource}>
                🔗 Open Original
              </button>
            )}
          </div>
        </div>
        
        <div className="actions">
          <button className="reprocess-button" onClick={handleReprocess}>
            🔄 Reprocess
          </button>
        </div>
      </div>

      <div className="detail-content">
        {artifact.ai_recommendation && (
          <div className="recommendation-section">
            <h3>AI Recommendation</h3>
            <div className={`recommendation-badge ${getRecommendationClass(artifact.ai_recommendation)}`}>
              {artifact.ai_recommendation}
            </div>
            
            {artifact.ai_reasoning && (
              <div className="reasoning">
                <h4>Reasoning</h4>
                <p>{artifact.ai_reasoning}</p>
              </div>
            )}
            
            {artifact.provider && (
              <div className="provider-info">
                <small>
                  Analyzed by: {artifact.provider}
                  {artifact.model && ` (${artifact.model})`}
                </small>
              </div>
            )}
          </div>
        )}

        {artifact.extracted_content && (
          <div className="content-section">
            <h3>Extracted Content</h3>
            <div className="content-preview">
              <pre>{artifact.extracted_content}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetailPane;