import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  processArtifact: (data: { type: string; content: string; source: string }) => Promise<any>;
  getArtifacts: () => Promise<any[]>;
  getArtifact: (id: string) => Promise<any>;
  deleteArtifact: (id: string) => Promise<void>;
  updateConfig: (config: any) => Promise<void>;
  getConfig: () => Promise<any>;
  reprocessArtifact: (id: string) => Promise<any>;
  onArtifactAdded: (callback: (artifactId: string) => void) => void;
  onArtifactUpdated: (callback: (artifactId: string) => void) => void;
  onDebugLog?: (callback: (message: string) => void) => void;
}

const electronAPI: ElectronAPI = {
  processArtifact: (data) => ipcRenderer.invoke('process-artifact', data),
  getArtifacts: () => ipcRenderer.invoke('get-artifacts'),
  getArtifact: (id) => ipcRenderer.invoke('get-artifact', id),
  deleteArtifact: (id) => ipcRenderer.invoke('delete-artifact', id),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  reprocessArtifact: (id) => ipcRenderer.invoke('reprocess-artifact', id),
  onArtifactAdded: (callback) => ipcRenderer.on('artifact-added', (event, artifactId) => callback(artifactId)),
  onArtifactUpdated: (callback) => ipcRenderer.on('artifact-updated', (event, artifactId) => callback(artifactId)),
  onDebugLog: (callback) => ipcRenderer.on('debug-log', (event, message) => callback(message)),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);