"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const conet_proxy_1 = require("@conet.project/conet-proxy");
const electron_1 = require("electron");
const createClientServer = () => {
    return new Promise(async (resolve) => {
        const port = 3001;
        console.log(`attempting to listen on port ${port}`);
        await (0, conet_proxy_1.launchDaemon)(port, electron_1.app.getPath('userData'));
        await new Promise(executor => setTimeout(() => executor(true), 3000));
        resolve({
            clientServerPort: port
        });
    });
};
module.exports = {
    createClientServer
};
