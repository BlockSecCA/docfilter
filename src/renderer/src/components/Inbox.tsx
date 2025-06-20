import React, { useState, useEffect } from 'react';
import './Inbox.css';

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

interface InboxProps {
  onArtifactSelect: (artifact: Artifact) => void;
  refreshTrigger: number;
}

function Inbox({ onArtifactSelect, refreshTrigger }: InboxProps) {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    loadArtifacts();
  }, [refreshTrigger]);

  const loadArtifacts = async () => {
    try {
      const data = await window.electronAPI.getArtifacts();
      setArtifacts(data);
    } catch (error) {
      console.error('Error loading artifacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedArtifacts = artifacts
    .filter(artifact => {
      if (filter === 'all') return true;
      if (filter === 'read') return artifact.ai_recommendation?.toLowerCase() === 'read';
      if (filter === 'discard') return artifact.ai_recommendation?.toLowerCase() === 'discard';
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      
      if (sortOrder === 'newest') {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

  const handleDelete = async (e: React.MouseEvent, artifactId: string) => {
    e.stopPropagation();
    try {
      await window.electronAPI.deleteArtifact(artifactId);
      loadArtifacts();
    } catch (error) {
      console.error('Error deleting artifact:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'file': return '📄';
      case 'url': return '🔗';
      default: return '📄';
    }
  };

  const getRecommendationClass = (recommendation?: string) => {
    if (!recommendation) return 'pending';
    return recommendation.toLowerCase() === 'read' ? 'read' : 'discard';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="inbox loading">
        <div className="spinner"></div>
        <p>Loading artifacts...</p>
      </div>
    );
  }

  return (
    <div className="inbox">
      <div className="inbox-header">
        <h2>Inbox ({filteredAndSortedArtifacts.length})</h2>
        <div className="controls">
          <div className="filter-buttons">
            <button 
              className={filter === 'all' ? 'active' : ''} 
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button 
              className={filter === 'read' ? 'active' : ''} 
              onClick={() => setFilter('read')}
            >
              Read
            </button>
            <button 
              className={filter === 'discard' ? 'active' : ''} 
              onClick={() => setFilter('discard')}
            >
              Discard
            </button>
          </div>
          <div className="sort-controls">
            <label htmlFor="sort-select">Sort:</label>
            <select 
              id="sort-select"
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      <div className="artifact-list">
        {filteredAndSortedArtifacts.length === 0 ? (
          <div className="empty-state">
            <p>No artifacts yet</p>
            <span>Drop files or add URLs to get started</span>
          </div>
        ) : (
          filteredAndSortedArtifacts.map(artifact => (
            <div
              key={artifact.id}
              className="artifact-item"
              onClick={() => onArtifactSelect(artifact)}
            >
              <div className="artifact-icon">
                {getTypeIcon(artifact.type)}
              </div>
              
              <div className="artifact-content">
                <div className="artifact-title">
                  {artifact.source.length > 40 
                    ? artifact.source.substring(0, 40) + '...' 
                    : artifact.source}
                </div>
                
                <div className="artifact-meta">
                  <span className="artifact-date">
                    {formatDate(artifact.created_at)}
                  </span>
                  
                  {artifact.ai_recommendation && (
                    <span className={`recommendation ${getRecommendationClass(artifact.ai_recommendation)}`}>
                      {artifact.ai_recommendation}
                    </span>
                  )}
                </div>
                
                {artifact.ai_reasoning && (
                  <div className="artifact-reasoning">
                    {artifact.ai_reasoning.length > 80 
                      ? artifact.ai_reasoning.substring(0, 80) + '...' 
                      : artifact.ai_reasoning}
                  </div>
                )}
              </div>
              
              <button
                className="delete-button"
                onClick={(e) => handleDelete(e, artifact.id)}
                title="Delete artifact"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Inbox;