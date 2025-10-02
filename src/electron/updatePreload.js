const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  cancelUpdate: () => ipcRenderer.send('cancel-update'),
  hideWindow: () => ipcRenderer.send('hide-update-window'),
  installNow: () => ipcRenderer.send('install-now'),
  onNewVersion: (callback) => ipcRenderer.on('new-version',(_,info)=>callback(info)),
  onDownloadProgress :(callback) => ipcRenderer.on('download-progress',(_,progress)=>callback(progress))
});