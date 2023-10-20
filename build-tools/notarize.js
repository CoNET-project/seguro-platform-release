require('dotenv').config();
process.env.DEBUG = 'electron-notarize*'
const {notarize} = require('electron-notarize');

exports.default = async function notarizing(context) {
    const {electronPlatformName, appOutDir} = context;
    if (electronPlatformName !== 'darwin') {
        return;
    }

    const appName = context.packager.appInfo.productFilename;
    try {
        return await notarize({
            appBundleId: 'app.conet.platform',
            appPath: `${appOutDir}/${appName}.app`,
            appleId: process.env.NOTARIZE_APPLE_ID,
            appleIdPassword: process.env.NOTARIZE_APPLE_PASS,
            ascProvider: '7M7YV9RB5V'
        });
    } catch (err) {
        console.log(err)
    }
};