import React, { useState, useEffect } from 'react';
import './ConfigModal.css';

interface ConfigModalProps {
  onClose: () => void;
}

interface Config {
  system_prompt: string;
  default_provider: string;
  providers: {
    openai?: { api_key: string; model?: string };
    anthropic?: { api_key: string; model?: string };
    local?: { endpoint: string; model?: string };
  };
}

function ConfigModal({ onClose }: ConfigModalProps) {
  const [config, setConfig] = useState<Config>({
    system_prompt: '',
    default_provider: 'openai',
    providers: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await window.electronAPI.getConfig();
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await window.electronAPI.updateConfig(config);
      onClose();
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  const updateSystemPrompt = (prompt: string) => {
    setConfig(prev => ({ ...prev, system_prompt: prompt }));
  };

  const updateProvider = (provider: string, key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [provider]: {
          ...prev.providers[provider as keyof typeof prev.providers],
          [key]: value
        }
      }
    }));
  };

  const updateDefaultProvider = (provider: string) => {
    setConfig(prev => ({ ...prev, default_provider: provider }));
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="config-modal">
          <div className="loading">Loading configuration...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="config-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configuration</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="config-section">
            <h3>System Prompt</h3>
            <textarea
              value={config.system_prompt}
              onChange={(e) => updateSystemPrompt(e.target.value)}
              rows={4}
              placeholder="Enter the instructions for the AI to follow when analyzing content..."
            />
          </div>

          <div className="config-section">
            <h3>Default Provider</h3>
            <select
              value={config.default_provider}
              onChange={(e) => updateDefaultProvider(e.target.value)}
            >
              <option value="openai">OpenAI</option>
              <option value="anthropic">Anthropic</option>
              <option value="local">Local LLM</option>
            </select>
          </div>

          <div className="config-section">
            <h3>LLM Providers</h3>
            
            <div className="provider-config">
              <h4>OpenAI</h4>
              <div className="input-group">
                <label>API Key:</label>
                <input
                  type="password"
                  value={config.providers.openai?.api_key || ''}
                  onChange={(e) => updateProvider('openai', 'api_key', e.target.value)}
                  placeholder="sk-..."
                />
              </div>
              <div className="input-group">
                <label>Model:</label>
                <input
                  type="text"
                  value={config.providers.openai?.model || 'gpt-3.5-turbo'}
                  onChange={(e) => updateProvider('openai', 'model', e.target.value)}
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            </div>

            <div className="provider-config">
              <h4>Anthropic</h4>
              <div className="input-group">
                <label>API Key:</label>
                <input
                  type="password"
                  value={config.providers.anthropic?.api_key || ''}
                  onChange={(e) => updateProvider('anthropic', 'api_key', e.target.value)}
                  placeholder="sk-ant-..."
                />
              </div>
              <div className="input-group">
                <label>Model:</label>
                <input
                  type="text"
                  value={config.providers.anthropic?.model || 'claude-3-haiku-20240307'}
                  onChange={(e) => updateProvider('anthropic', 'model', e.target.value)}
                  placeholder="claude-3-haiku-20240307"
                />
              </div>
            </div>

            <div className="provider-config">
              <h4>Local LLM</h4>
              <div className="input-group">
                <label>Endpoint:</label>
                <input
                  type="text"
                  value={config.providers.local?.endpoint || ''}
                  onChange={(e) => updateProvider('local', 'endpoint', e.target.value)}
                  placeholder="http://localhost:11434/api/generate"
                />
              </div>
              <div className="input-group">
                <label>Model Name:</label>
                <input
                  type="text"
                  value={config.providers.local?.model || ''}
                  onChange={(e) => updateProvider('local', 'model', e.target.value)}
                  placeholder="llama2"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="save-button" onClick={handleSave}>
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfigModal;