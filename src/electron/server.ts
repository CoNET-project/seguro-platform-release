

import * as seguroGateway from '@conet.project/conet-gateway'


const createClientServer = () => {
    return new Promise(async resolve => {

        const port = 3001
        console.log(`attempting to listen on port ${port}`)

        seguroGateway.launchSeguroGateway(port, '')

        resolve({
            clientServerPort: port
        })

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
    })
}

module.exports = {
    createClientServer
}