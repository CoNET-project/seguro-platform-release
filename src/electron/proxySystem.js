const { exec,execSync } = require('child_process');
const { inspect } = require('util');
const Registry = require('winreg');
const USE_PAC = true; // 如要使用 PAC，改为 true

const isGnome=()=>{
    try{
        const desktopEnv = execSync('echo $XDG_CURRENT_DESKTOP',{encoding:'utf8'}).trim();
        if(desktopEnv.includes('GNOME')) {
            return true;
        }
    }catch(error){
        return false;
    }
    try{
        execSync('gnome-shell --version',{stdio:'ignore'});
        return true
    }catch(error){
        return false;
    }
}
const isKde=()=>{
    try{
        const desktopEnv = execSync('echo $XDG_CURRENT_DESKTOP',{encoding:'utf8'}).trim();
        if(desktopEnv.includes('KDE')) {
            return true;
        }
    }catch(error){
        return false;
    }
    try{
        execSync('plasmashell-shell --version',{stdio:'ignore'});
        return true
    }catch(error){
        return false;
    }
}
const execPromise = (command) => {
    return new Promise((resolve, reject) => {
        exec(command, (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
};
const getMacProxy = async (event = null) => {
    const getNetworkServices = async () => {
        const stdout = await execPromise('networksetup -listallnetworkservices');
        return stdout.split('\n').slice(1).filter(line => line.trim() !== '');
    };

    const checkProxyStatus = async (service) => {
        const stdout = await execPromise(
            `networksetup -getwebproxy "${service}" ;` +
            `networksetup -getsecurewebproxy "${service}" ; ` +
            `networksetup -getsocksfirewallproxy "${service}" ;` + 
            `networksetup -getautoproxyurl "${service}" ;` +
            `networksetup -getautoproxyurl "${service}" ;`
        );
        return stdout.includes("Enabled: Yes");
    };
    try {
        const services = await getNetworkServices();
        const proxyChecks = await Promise.all(services.map(checkProxyStatus));

        const anyProxyEnabled = proxyChecks.includes(true);

        if (event) {
            event.returnValue = anyProxyEnabled;
        }
        return anyProxyEnabled;
    } catch (error) {
        if (event) {
            event.returnValue = false;
        }
        return false;
    }
};

const sh = (cmd) =>
  new Promise((resolve) => {
    exec(cmd, (error, stdout, stderr) => resolve({ error, stdout, stderr }));
  });

const setMacProxy=async (PROXY_IP,HTTP_PORT,SOCKS_PORT,callback)=>{
    try {
        const { stdout: rtOut } = await sh(`/sbin/route -n get default 2>/dev/null | awk '/interface:/{print $2}'`);

        const iface = rtOut.trim();

        if (!iface) {
            if (callback) callback(false);
            return;
        }


        const { stdout: nso } = await sh(`/usr/sbin/networksetup -listnetworkserviceorder`);
        const svc = (() => {
        // 解析块：(n) ServiceName  + 下一行的 (Hardware Port..., Device: enX)
        const lines = nso.split("\n");
        let currentSvc = "";
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trimEnd();

            // 匹配形如 “(1) Wi-Fi” 的行
            const m = line.match(/^\(\d+\)\s+(.*)$/);
            if (m) {
                currentSvc = m[1].replace(/^\*\s*/, ""); // 去掉可能的起始星号（禁用服务）
                continue;
            }

            // 匹配 “Device: enX”
            const md = line.match(/Device:\s*([^)]+)/);
            if (md && md[1].trim() === iface && currentSvc) {
                return currentSvc;
            }
        }
        return "";
        })();

        if (!svc) {
        // 找不到与 iface 匹配的服务（可能是桥接/虚拟设备）；兜底：直接失败
            if (callback) callback(false);
            return;
        }

        const manualCmd =
            `/usr/sbin/networksetup -setwebproxy "${svc}" ${PROXY_IP} ${HTTP_PORT} ; ` +
            `/usr/sbin/networksetup -setwebproxystate "${svc}" on ; ` +
            `/usr/sbin/networksetup -setsecurewebproxy "${svc}" ${PROXY_IP} ${HTTP_PORT} ; ` +
            `/usr/sbin/networksetup -setsecurewebproxystate "${svc}" on ; ` +
            `/usr/sbin/networksetup -setsocksfirewallproxy "${svc}" ${PROXY_IP} ${SOCKS_PORT} ; ` +
            `/usr/sbin/networksetup -setsocksfirewallproxystate "${svc}" on`;

        const pacCmd =
            `/usr/sbin/networksetup -setautoproxyurl "${svc}" "http://${PROXY_IP}:${HTTP_PORT}/pac" ; ` +
            `/usr/sbin/networksetup -setautoproxystate "${svc}" on`;


        const commandFinal = USE_PAC ? pacCmd : manualCmd;
        console.log(inspect({ iface, service: svc, commandFinal }, { colors: true, depth: null }));

        const { stdout: grpOut } = await sh(`groups $(whoami)`);
        const inAdmin = grpOut.includes("admin");

        // 先小试一条需要权限的命令（对目标服务），判断是否需要弹框
        const { error: dryErr } = await sh(`/usr/sbin/networksetup -setwebproxystate "${svc}" off`);
        const needAskPass = !!dryErr;

        if (inAdmin && !needAskPass) {
            // 直接跑
            const { error } = await sh(commandFinal);
            if (callback) callback(!error);
            return;
        } else {
            // 用 osascript 提权执行
            const escaped = commandFinal.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
            const osa = `osascript -e 'do shell script "${escaped}" with administrator privileges'`;
            const { error } = await sh(osa);
            if (callback) callback(!error);
            return;
        }

    } catch (e) {
        if (callback) callback(false);
    }
    

    // exec(`/sbin/route -n get default 2>/dev/null | awk '/interface:/{print $2}'`, (error, stdout) => {
    //     if (error) {
    //         if(callback) callback(false);
    //         return;
    //     }

    //     const interfaces = stdout.split('\n').slice(1).filter(line => line.trim() !== '');
    //     if (interfaces.length === 0) {
    //         if (callback) callback(false);
    //         return;
    //     }

    //     // 构建一个包含所有 networksetup 命令的单行字符串
    //     const command11 = interfaces.map(service => 
    //         `networksetup -setwebproxy "${service}" ${PROXY_IP} ${HTTP_PORT} ; ` +
    //         `networksetup -setsecurewebproxy "${service}" ${PROXY_IP} ${HTTP_PORT} ; ` +
    //         `networksetup -setsocksfirewallproxy "${service}" ${PROXY_IP} ${SOCKS_PORT}`
    //     ).join(" ; ");

    //     const commandNew = interfaces.map(service => 
    //         `networksetup -setautoproxyurl "${service}" "http://${PROXY_IP}:${HTTP_PORT}/pac"; ` +
    //         `networksetup -setautoproxystate "${service}" on;`
    //     ).join(" ; ");

    //     console.log(`${inspect(commandNew)}`)

    //     //先检测管理员身份有没有授予权限
    //     let isAdminButNoPermission=false;
    //     exec(`networksetup -setwebproxy "Wi-Fi" 127.0.0.1 3002`, (checkError, stdout, stderr) => {
    //         checkError?isAdminButNoPermission=true:isAdminButNoPermission=false;            

    //         //检测当前用户是否在admin组
    //         exec("groups $(whoami)", (error, stdout) => {
    //             if (stdout.includes("admin") && !isAdminButNoPermission) {
    //                 exec(command11, (error) => {
    //                     if (error) {
    //                         if (callback) callback(false);
    //                         return;
    //                     }
    //                     if (callback) callback(true);
    //                 });
    //             } else {
    //                 // 使用 osascript 提升权限
    //                 const osascriptCommand = `osascript -e 'do shell script "${command11.replace(/"/g,'\\"')}" with administrator privileges'`;
    //                 exec(osascriptCommand, (err, stdout, stderr) => {
    //                     if (err) {
    //                         if (callback) callback(false);
    //                         return;
    //                     } else {
    //                         if (callback) callback(true);
    //                     }
    //                 });
    //             }
    //         });
    //     }); 




    // });
}
const closeMacProxy=async(callback)=>{
    
    
        exec(`networksetup -listallnetworkservices`, (error, stdout) => {
            if (error) {
                if(callback) callback(false);
                return;
            }
            // 解析网络接口
            const interfaces = stdout.split('\n').slice(1).filter(line => line.trim() !== '');
            if (interfaces.length === 0) {
                if (callback) callback(false);
                return;
            }

            // 构建一个包含所有 networksetup 命令的单行字符串
            const command = interfaces.map(service => 
                `networksetup -setautoproxystate "${service}" off; ` +
                `networksetup -setstreamingproxystate "${service}" off; ` +
                `networksetup -setftpproxystate "${service}" off; ` +
                `networksetup -setgopherproxystate "${service}" off; ` +
                `networksetup -setwebproxystate "${service}" off; ` +
                `networksetup -setsecurewebproxystate "${service}" off; ` +
                `networksetup -setsocksfirewallproxystate "${service}" off`
            ).join(" ; ");

            //先检测管理员身份有没有授予权限
            let isAdminButNoPermission=false;
            exec(`networksetup -setwebproxy "Wi-Fi" 127.0.0.1 3002`, (checkError, stdout, stderr) => {
                checkError?isAdminButNoPermission=true:isAdminButNoPermission=false;  

                //检测当前用户是否在admin组
                exec("groups $(whoami)", (error, stdout) => {
                    if (stdout.includes("admin") && !isAdminButNoPermission) {
                         exec(command, (error) => {
                            if (error) {
                                if (callback) callback(false);
                                return;
                            }
                            if (callback) callback(true);
                        });
                    } else {
                        // 使用 osascript 提升权限
                        const osascriptCommand = `osascript -e 'do shell script "${command.replace(/"/g,'\\"')}" with administrator privileges'`;
                        exec(osascriptCommand, (err, stdout, stderr) => {
                            if (err) {
                                if (callback) callback(false);
                                return;
                            } else {
                                if (callback) callback(true);
                            }
                        });
                    }
                });
            });
        });
    
}

const getWinProxy = async (event = null) => {
    const setReturnValueAsync = (event, value) => {
        return new Promise((resolve) => {
            if (event) {
                event.returnValue = value;
            }
            resolve();
        });
    };
    const regPromise = (command) => {
        return new Promise((resolve, reject) => {
            regKey.get(command, (error, stdout) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    };
    const regKey = new Registry({
        hive: Registry.HKCU,
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
    });

    try {
        const enableItem = await regPromise('ProxyEnable');
        const proxyEnabled = enableItem.value.slice(-1) === '1';

        if (!proxyEnabled) {
            await setReturnValueAsync(event, false);
            return false;
        }

        const serverItem = await regPromise('ProxyServer');
        const proxyValue = serverItem.value;

        const result = { proxyEnabled, val: proxyValue };
        await setReturnValueAsync(event, result);
        return result;

    } catch (err) {
        await setReturnValueAsync(event, false);
        return false;
    }
};


const setWinProxy=(PROXY_IP,HTTP_PORT,SOCKS_PORT,callback)=>{
    const proxyKey = new Registry({
        hive: Registry.HKCU,
        key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
    })

    proxyKey.set('ProxyEnable', Registry.REG_DWORD, 1, (err) => {
        if (err) {
            if(callback) callback(false);
            return
        }
    })

    proxyKey.set('ProxyServer', Registry.REG_SZ, `${PROXY_IP}:${HTTP_PORT}`, (err) => {
        if (err) {
            if(callback) callback(false);
            return
        }
        if(callback) callback(true);
    })
}

const closeWinProxy=async(callback)=>{
    const status=await getWinProxy();
    console.log(status,'status')
    if(status) {
        const proxyKey = new Registry({
            hive: Registry.HKCU,
            key: '\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings',
        })

        proxyKey.set('ProxyEnable', Registry.REG_DWORD, 0, (err) => {
            if (err) {
                if(callback) callback(false);
                return
            }
            if(callback) callback(true);
        })
    }else{
        if(callback) callback(true);
    }
}

const getLinProxy = async (event=null) => {
    const getProxyFromEnv = () => {
        return process.env.HTTP_PROXY ||
               process.env.http_proxy ||
               process.env.HTTPS_PROXY ||
               process.env.https_proxy ||
               process.env.ALL_PROXY ||
               process.env.all_proxy;
    };

    const isGnomeProxyEnabled = () => {
        return new Promise((resolve, reject) => {
            try {
                const mode = execSync("gsettings get org.gnome.system.proxy mode", { encoding: 'utf8' }).trim();
                resolve(mode === "'manual'");
            } catch (err) {
                reject(err);
            }
        });
    };

    const isKdeProxyEnabled = () => {
        return new Promise((resolve, reject) => {
            try {
                const proxyType = execSync("kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'ProxyType'", { encoding: 'utf8' }).trim();
                resolve(proxyType === "1" || proxyType === "2");
            } catch (err) {
                reject(err);
            }
        });
    };

    let proxyEnabled = false;

    // 1. 检查环境变量
    const proxy = getProxyFromEnv();
    if (proxy) {
        proxyEnabled = true;
    }

    // 2. 检查 GNOME 设置
    if (isGnome() && await isGnomeProxyEnabled()) {
        proxyEnabled = true;
    }

    // 3. 检查 KDE 设置
    if (isKde() && await isKdeProxyEnabled()) {
        proxyEnabled = true;
    }

    // 设置返回值
    if (event) {
        event.returnValue = proxyEnabled;
    }
    return proxyEnabled;
};

const setLinProxy=(PROXY_IP,HTTP_PORT,SOCKS_PORT,callback)=>{
    if (isGnome()) {
        const command=`gsettings set org.gnome.system.proxy mode 'manual' ; ` +
            `gsettings set org.gnome.system.proxy.http host '${PROXY_IP}' ; ` +
            `gsettings set org.gnome.system.proxy.http port ${HTTP_PORT} ; ` +
            `gsettings set org.gnome.system.proxy.https host '${PROXY_IP}' ; ` +
            `gsettings set org.gnome.system.proxy.https port ${HTTP_PORT} ; ` +
            `gsettings set org.gnome.system.proxy.socks host '${PROXY_IP}' ; ` +
            `gsettings set org.gnome.system.proxy.socks port ${HTTP_PORT}`

        exec(command, (error) => {
            if (error) {
                if (callback) callback(false);
                return;
            }
            if (callback) callback(true);
        });
    } else if (isKde()) {
        const command=`kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'ProxyType' 1 ; ` +
            `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'httpProxy' '${PROXY_IP}:${HTTP_PORT}' ; ` +
            `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'httpsProxy' '${PROXY_IP}:${HTTP_PORT}' ; ` +
            `kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'socksProxy' '${PROXY_IP}:${HTTP_PORT}'`

        exec(command, (error) => {
            if (error) {
                if (callback) callback(false);
                return;
            }
            if (callback) callback(true);
        });
    } else {
        process.env.HTTP_PROXY = `http://${PROXY_IP}:${HTTP_PORT}`;
        process.env.HTTPS_PROXY = `https://${PROXY_IP}:${HTTP_PORT}`;
        process.env.ALL_PROXY = `socks5://${PROXY_IP}:${HTTP_PORT}`;

        if(callback) callback(true);
    }
};

const closeLinProxy=async(callback)=>{
    const status=await getLinProxy();
    if(status) {
        if (isGnome()) {
            exec("gsettings set org.gnome.system.proxy mode 'none'", (error)=>{
                if (error) {
                    if(callback) callback(false);
                    return;
                }
                if(callback) callback(true);
            });
        } else if (isKde()) {
            exec("kwriteconfig5 --file kioslaverc --group 'Proxy Settings' --key 'ProxyType' 0", (error)=>{
                if (error) {
                    if(callback) callback(false);
                    return;
                }
                if(callback) callback(true);
            }); // 0=无代理
        } else {
            delete process.env.HTTP_PROXY;
            delete process.env.HTTPS_PROXY;
            delete process.env.ALL_PROXY;

            if(callback) callback(true);
        }
    }else{
        if(callback) callback(true);
    }
}
const getProxy=(event)=>{
    if (process.platform == 'darwin') {
        getMacProxy(event);
    }else if(process.platform == 'win32'){
        getWinProxy(event);
    }else if(process.platform == 'linux'){
        getLinProxy(event);
    }
}


const setProxy=(PROXY_IP = '127.0.0.1',HTTP_PORT = 3002,SOCKS_PORT = 3002 ,callback=null)=>{
    
    if (process.platform == 'darwin') {
        setMacProxy(PROXY_IP,HTTP_PORT,SOCKS_PORT,callback);
    }else if(process.platform == 'win32'){
        setWinProxy(PROXY_IP,HTTP_PORT,SOCKS_PORT,callback);
    }else if(process.platform == 'linux'){
        setLinProxy(PROXY_IP,HTTP_PORT,SOCKS_PORT,callback);
    }
    

}
const closeProxy=(callback=null)=>{
    if(process.platform == 'darwin'){
        closeMacProxy(callback);
    }else if(process.platform == 'win32'){
        closeWinProxy(callback);
    }else if(process.platform == 'linux'){
        closeLinProxy(callback);
    }
}
module.exports = {getProxy,setProxy,closeProxy};





//          networksetup -listallnetworkservices