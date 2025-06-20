import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  processArtifact: (data: { type: string; content: string; source: string }) => Promise<any>;
  getArtifacts: () => Promise<any[]>;
  getArtifact: (id: string) => Promise<any>;
  deleteArtifact: (id: string) => Promise<void>;
  updateConfig: (config: any) => Promise<void>;
  getConfig: () => Promise<any>;
  reprocessArtifact: (id: string) => Promise<any>;
}

const electronAPI: ElectronAPI = {
  processArtifact: (data) => ipcRenderer.invoke('process-artifact', data),
  getArtifacts: () => ipcRenderer.invoke('get-artifacts'),
  getArtifact: (id) => ipcRenderer.invoke('get-artifact', id),
  deleteArtifact: (id) => ipcRenderer.invoke('delete-artifact', id),
  updateConfig: (config) => ipcRenderer.invoke('update-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  reprocessArtifact: (id) => ipcRenderer.invoke('reprocess-artifact', id),
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);