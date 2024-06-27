

import {launchDaemon} from '@conet.project/conet-proxy'


const createClientServer = () => {
    return new Promise(async resolve => {

        const port = 3001
        console.log(`attempting to listen on port ${port}`)

        launchDaemon(port, '')

        resolve({
            clientServerPort: port
        })
    })
}

module.exports = {
    createClientServer
}