require('dotenv').config();
process.env.DEBUG = 'electron-notarize*'
const {notarize} = require('electron-notarize');
//	xcrun altool --list-apps -u "username" -p "password"
exports.default = async function notarizing(context) {
    const {electronPlatformName, appOutDir} = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
	console.log(`notarize start!`)
    try {
        await notarize({
			tool: 'notarytool',
            appBundleId: 'CONET-Labs.CONET-Labs-SilentPass',
            appPath: `${appOutDir}/${appName}.app`,
            appleId: process.env.NOTARIZE_APPLE_ID,
            appleIdPassword: process.env.NOTARIZE_APPLE_PASS,
            ascProvider: '23YYTMA7YQ',
			teamId: '23YYTMA7YQ'
        });
		console.log(`notarize success!`)
    } catch (err) {
		console.log(`notarize Error!!`)
        console.log(err)
    }
};