const { createClientServer } = require('./server')
const { createWindow } = require('./window')

const start = async () => {
	console.log('application booting')

    let clientServerPort = 3000
	console.log('creating client server')
	clientServerPort = (await createClientServer()).clientServerPort

    console.log('creating electron window')
    await createWindow({ clientServerPort })
    console.log('created electron window')

    console.log('application booted')
}

start()
