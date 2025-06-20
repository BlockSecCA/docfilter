import { contextBridge, ipcRenderer } from 'electron';
const electronAPI = {
    processArtifact: (data) => ipcRenderer.invoke('process-artifact', data),
    getArtifacts: () => ipcRenderer.invoke('get-artifacts'),
    getArtifact: (id) => ipcRenderer.invoke('get-artifact', id),
    deleteArtifact: (id) => ipcRenderer.invoke('delete-artifact', id),
    updateConfig: (config) => ipcRenderer.invoke('update-config', config),
    getConfig: () => ipcRenderer.invoke('get-config'),
    reprocessArtifact: (id) => ipcRenderer.invoke('reprocess-artifact', id),
};
contextBridge.exposeInMainWorld('electronAPI', electronAPI);
