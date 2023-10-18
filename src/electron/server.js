"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const seguroGateway = __importStar(require("@conet.project/conet-gateway"));
const createClientServer = () => {
    return new Promise(async (resolve) => {
        const port = 3001;
        console.log(`attempting to listen on port ${port}`);
        seguroGateway.launchSeguroGateway(port, '');
        resolve({
            clientServerPort: port
        });
        // const server = app.listen(
        //     port,
        //     'localhost',
        //     () => {
        //         console.log(`listening on port ${port}`)
        //         console.log('created client server')
        //
        //         resolve({
        //             clientServerPort: port
        //         })
        // })
        //
        // server.on('error', (error) => {
        //     if (error.code !== 'EADDRINUSE') {
        //         console.error('something went wrong')
        //     }
        //     console.error(`port ${port} is in use`)
        //
        //     process.exit(1)
        // })
    });
};
module.exports = {
    createClientServer
};
