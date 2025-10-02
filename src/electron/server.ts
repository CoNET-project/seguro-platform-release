import { app } from 'electron'

import {launchDaemon} from '@conet.project/conet-proxy'
const userDataDir = app.getPath('userData');

const createClientServer = () => {
    return new Promise(async resolve => {

        const port = 3001
        console.log(`attempting to listen on port ${port}`)

        launchDaemon(port, userDataDir)

        resolve({
            clientServerPort: port
        })
    })
}

module.exports = {
    createClientServer
}