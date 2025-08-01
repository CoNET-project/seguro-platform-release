// preload.js
const { contextBridge, ipcRenderer } = require('electron');



//安全地给 WebView 页面挂一个 window.electron 对象
contextBridge.exposeInMainWorld('electron', {
    send: (message) => {
        ipcRenderer.send('webview-message', message);
    }
});

// 收到主进程或其他发过来的信息，注入到web页面
ipcRenderer.on('webview-message', (event, message) => {
    window.postMessage(message, '*');
});

