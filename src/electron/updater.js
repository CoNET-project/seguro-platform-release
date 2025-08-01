const {autoUpdater} = require('electron-updater');
const { app,BrowserWindow,ipcMain } = require('electron');
const path = require('path');


const RESOURCES_PATH = app.isPackaged ?
	path.join(process.resourcesPath, 'public') :
	path.join(__dirname, './../../public');

const getAssetPath = (...paths) => {
	return path.join(RESOURCES_PATH, ...paths);
};
const createUpdateWindow=(updateWindow,mainWindow,version)=> {
    updateWindow = new BrowserWindow({
		width: 400,
		height: 210,
		frame: false,
		alwaysOnTop: true, // 始终在最上层
		resizable: false,
		transparent: true,
		modal: true,
		show: false,
		parent: mainWindow, // 可选
		webPreferences: {
	  		nodeIntegration: false,
	  		contextIsolation: true,
	  		webSecurity:false,
	  		preload:path.join(__dirname,'updatePreload.js')
		},
 	});

  	updateWindow.loadFile(getAssetPath('update.html'));

  	updateWindow.once('ready-to-show', () => {
		updateWindow.show();
		updateWindow.webContents.send('new-version',version)
  	});
  	ipcMain.on('cancel-update', (event) => {
		updateWindow.hide();
		updateWindow=null;
	});
	ipcMain.on('hide-update-window', (event) => {
	  	autoUpdater.downloadUpdate()
		if(updateWindow){
			updateWindow.hide();
		}
	});
	ipcMain.on('install-now', (event) => {
		autoUpdater.downloadUpdate()
	});
	autoUpdater.on('download-progress', (progressObj) => {
	  	const percent = Math.round(progressObj.percent);
	  	updateWindow?.webContents.send('download-progress', percent);
	});
	autoUpdater.on('error', (err) => {
	  	updateWindow?.webContents.send('update-error', err);
	})
}
const updater=(updateWindow,mainWindow,server)=>{
	const url = `${server}/${process.platform}/${process.arch}/`;
	autoUpdater.setFeedURL({provider: 'generic',url: url});
	autoUpdater.autoDownload=false;

	autoUpdater.on('update-available', (info) => {
		createUpdateWindow(updateWindow,mainWindow,info.version);
	})
	autoUpdater.on('update-downloaded', (info) => {
	  	autoUpdater.quitAndInstall()
	})
	
	// 立即检查一次
	autoUpdater.checkForUpdates()
	// 之后每天检查一次
	setInterval(() => {
	  	autoUpdater.checkForUpdates()
	}, 60000*60*24)
}

module.exports = updater;