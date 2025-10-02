

const {app, BrowserWindow, ipcMain, Tray,Menu} = require('electron');

// 禁用异步 DNS 特性
if (process.versions.electron) {
  const { app } = require('electron');
  app.commandLine.appendSwitch('disable-features', 'AsyncDns,NetworkServiceInProcess');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

const { getProxy,setProxy, closeProxy } = require('./proxySystem');
const updater = require('./updater');
const { runBridge, Bridge } = require('./webview-bridge');
const path = require('path');

// app.setAboutPanelOptions({
//   applicationName: 'Silent Pass VPN',
//   applicationVersion: app.getVersion(),
//   copyright: '© 2025 Silent Pass',
// });

// 在 app.on('ready') 之前添加
// app.commandLine.appendSwitch('disable-features', 'AsyncDns');
// app.commandLine.appendSwitch('host-resolver-rules', 'MAP * ~NOTFOUND , EXCLUDE localhost');

// // 或者更简单的方法，禁用 c-ares
// process.env.NODE_OPTIONS = '--dns-result-order=ipv4first';

function setupMinimalMenu() {
    const appName = `Silent Pass VPN`
  const template =
    process.platform === "darwin"
      ? [
          {
            label: appName,
            submenu: [
              { role: "quit", label: `Exit/退出 ${appName}` } // macOS 的 App 菜单
            ]
          }
        ]
      : [
          {
            label: appName,
            submenu: [{ role: "quit", label: "Exit/退出 " + appName }] // Win/Linux
          }
        ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const isDevelopmentMode = process.env.NODE_ENV === 'development'

let mainWindow
let mobileWindow
// 儲存解析後的啟動參數
const launchArgs = {};




function parseArgs() {
	// 我們忽略前幾個元素，只關心自訂參數
	// 使用 slice(app.isPackaged ? 1 : 2) 來兼容開發和打包後的兩種模式
	const customArgs = process.argv.slice(app.isPackaged ? 1 : 2);

	customArgs.forEach(arg => {
		if (arg.startsWith('--')) {
			const [key, value] = arg.substring(2).split('=');
			if (key) {
				launchArgs[key] = value === undefined ? true : value; // 如果只有key沒有value，則設為true
			}
		}
	});
	console.log('Parsed launch arguments:', launchArgs);
}

const RESOURCES_PATH = app.isPackaged ?
    path.join(process.resourcesPath, 'public') :
    path.join(__dirname, './../../public');

const getAssetPath = (...paths) => {
    return path.join(RESOURCES_PATH, ...paths);
};

const createWindow = async ({clientServerPort}) => {

	parseArgs()
    await app.whenReady().then(()=>{
		closeProxy();
        setupMinimalMenu();
	})

    mainWindow = new BrowserWindow({
        width: 450,
        height: 800,
        show: false,
        webPreferences: {
          preload:path.join(__dirname,'preload.js'), // 预加载 JS
          contextIsolation: true, // 允许在 executeJavaScript 里访问 electron API
          nodeIntegration: true
        }
    })

    mobileWindow = new BrowserWindow({
        width: 450,
        height: 800,
        show: false,
        // resizable: false
    })

	mobileWindow.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	})
	const ChannelPartners= ''//'0xCC689B2FaC27a6340257274d287A6C4243403ca4'

    const clientServerUrl = `http://localhost:3001/?ChannelPartners=${ChannelPartners}`
    console.log(`clientServerUrl = ${clientServerUrl}`)
	try {
		console.log(`loading client index from ${clientServerUrl}`)
		const win = mainWindow.loadURL(clientServerUrl)

		if (isDevelopmentMode) {
			mainWindow.webContents.openDevTools()
			await mobileWindow.loadURL(clientServerUrl)
			mobileWindow.webContents.openDevTools()
		}
	} catch {
		console.error('failed to load client index')
		process.exit(1)
	}
    
    app.on('second-instance', ( event, commandLine, workingDirectory) => {
		mainWindow.restore()
	})

    app.on('window-all-closed', (event) => {
        app.quit()
    })
    
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow({
                clientServerPort
            })
        } else {
            mainWindow.restore()
        }
    })
    app.once('before-quit',(event)=>{
        event.preventDefault();
        closeProxy(()=>{
            app.quit()
        })
    })
    // // 监听渲染进程的消息
    // ipcMain.on('makeSet', (event) => {
    //     setProxy("127.0.0.1",3002,3002,(status)=>{
    //         event.reply('makeSetReply', status);
    //     })
    // });
    // ipcMain.on('makeClose', (event) => {
    //     closeProxy((status)=>{
    //         event.reply('makeCloseReply', status);
    //     })
    // });
    

    mainWindow.show()

    mainWindow.on('close', (event) => {
        app.quit()
    })

    if (isDevelopmentMode) {
        mobileWindow.show()
    }
    //自动更新
    let updateWindow;
    updater(updateWindow,mainWindow,'https://download.silentpass.io/release');

    //双向通信
    runBridge();

    // Bridge.send(mainWindow,'native_event',{a:99},(res)=>{console.log(res,'999999999999999999999')})
}

module.exports = {
    createWindow
}


//	--ChannelPartners 0x646dD90Da8f683fE80C0eAE251a23524afB3d926 --referrals 0xE235f3b481270F5DF2362c25FF5ED8Bdc834DcE9