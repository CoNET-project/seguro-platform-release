require('dotenv').config()

const config = {
    appId: "app.kloak.seguro",
    productName: "Seguro",
    compression: "maximum",
    nsis: {
        oneClick: false
    },
    win: {
        target: "nsis",
        artifactName: "Seguro-${version}.exe"
    },
    mac: {
        category: "public.app-category.utilities",
        entitlements: "build-tools/entitlements.mac.plist",
        entitlementsInherit: "build-tools/entitlements.mac.plist",
        hardenedRuntime: true,
        gatekeeperAssess: false
    },
    dmg: {
        backgroundColor: "#ffffff",
        contents: [
            {
                x: 110,
                y: 220
            },
            {
                x: 420,
                y: 220,
                type: "link",
                path: "/Applications"
            }
        ]
    },
    linux: {
        artifactName: "Seguro-${version}.deb",
        target: [
            "deb"
        ]
    },
    afterSign: "build-tools/notarize.js"
}

module.exports = config