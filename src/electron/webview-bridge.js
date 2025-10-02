const {BrowserWindow,ipcMain} = require('electron');
const { getProxy,setProxy,closeProxy } = require('./proxySystem');
const { shell } = require('electron');

const callbacks = {};

let callId = 0;

const generateCallbackId=()=> {
    return `cb_${Date.now()}_${callId++}`;
}

const Bridge = {
    send:(mainWindow,event, data, callback=null)=> {
        const message = { event, data };
        if (callback) {
            const callbackId = generateCallbackId();
            message.callbackId = callbackId;
            callbacks[callbackId] = callback;
        }
        const messageStr = JSON.stringify(message);
        mainWindow.webContents.send('webview-message', messageStr);
    },
    receive:(win,rawMessage) =>{
        if(typeof(rawMessage)!='string') return ;

        const parsed = JSON.parse(rawMessage);

        if (parsed.callbackId && parsed.response !== undefined) { // 处理回调响应
            const cb = callbacks[parsed.callbackId];
            if (cb) {
                cb(parsed.response);
                delete callbacks[parsed.callbackId];
            }
        }else { // 正常收到事件
            //开启vpn
            if (parsed.event === 'startVPN') {
                // 做一些事情
                closeProxy((status)=>{
                    setProxy("127.0.0.1", 3002 ,3002 ,(status)=>{
                        // 做一些事情后如果有回调就回复
                        if(parsed.callbackId){
                            const response = {
                                callbackId: parsed.callbackId,
                                response: { success: true }
                            };
                            win.webContents.send('webview-message', JSON.stringify(response));
                        }
                    })
                })
                
            }
            //关闭vpn
            if (parsed.event === 'stopVPN') {
                // 做一些事情
                closeProxy((status)=>{
                    // 做一些事情后如果有回调就回复
                    if(parsed.callbackId){
                        const response = {
                            callbackId: parsed.callbackId,
                            response: { success: true }
                        };
                        win.webContents.send('webview-message', JSON.stringify(response));
                    }
                })
            }
            //打开链接
            if (parsed.event === 'openUrl') {
                // 做一些事情
                if(parsed.data?.data){
                    shell.openExternal(parsed.data?.data); // 用默认浏览器打开
                }
            }
            
        }
    }


}

const runBridge=()=>{
    
    ipcMain.on('webview-message', (event, message) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        Bridge.receive(win,message);
    });
}

module.exports = { runBridge, Bridge };
