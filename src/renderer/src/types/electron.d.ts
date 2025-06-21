interface ElectronAPI {
  processArtifact: (data: { type: string; content: string; source: string }) => Promise<any>;
  getArtifacts: () => Promise<any[]>;
  getArtifact: (id: string) => Promise<any>;
  deleteArtifact: (id: string) => Promise<void>;
  updateConfig: (config: any) => Promise<void>;
  getConfig: () => Promise<any>;
  reprocessArtifact: (id: string) => Promise<any>;
  onArtifactAdded: (callback: (artifactId: string) => void) => void;
  onArtifactUpdated: (callback: (artifactId: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};