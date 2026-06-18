// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('luminaAPI', {
  // Project operations
  openPath: (path) => ipcRenderer.invoke('open-path', path),
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  listDirectory: (dirPath) => ipcRenderer.invoke('list-directory', dirPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // AI operations
  generateCode: (question) => ipcRenderer.invoke('generate-code', question),

  // Settings
  toggleFusion: (enabled) => ipcRenderer.invoke('toggle-fusion', enabled),
  getFusionStatus: () => ipcRenderer.invoke('get-fusion-status'),
});
