require('dotenv').config()

const config = {
    appId: "app.conet.platform",
    productName: "Silent-Pass-Proxy",
    compression: "maximum",
    files: [
        "**/*",
        "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
        "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
        "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
        "!**/node_modules/*.d.ts",
        "!**/node_modules/.bin",
        "!.editorconfig",
        "!**/._*",
        "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes,.github,.env}",
        "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
        "!**/{appveyor.yml,.travis.yml,circle.yml}",
        "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json,.yarnrc}",
        "!dist",
        "!src/electron/{.electron.js,.server.js,.window.js}",
        "public",
        "!build-tools"
    ],
    extraResources:[
        {
            from:'public',
            to:'public'
        }
    ],
    nsis: {
        oneClick: false,
        installerIcon: "public/512.ico"
    },
    win: {
        icon: "public/512.ico",
        target: "nsis",
        artifactName: "CONET-${version}.exe"
    },
    mac: {
        category: "public.app-category.utilities",
        entitlements: "build-tools/entitlements.mac.plist",
        entitlementsInherit: "build-tools/entitlements.mac.plist",
        hardenedRuntime: true,
        gatekeeperAssess: false,
        icon: "public/512.png",
        target:["zip","dmg"]
    },
    dmg: {
		background: 'public/background540.png',
        contents: [
            {
                x: 130,
                y: 170
            },
            {
                x: 460,
                y: 165,
                type: "link",
                path: "/Applications"
            }
        ]
    },
    linux: {
        artifactName: "CONET-${version}.deb",
        target: [
            "AppImage","deb", "rpm"
        ],
        category: "Network",
        icon: "public/256.png",
        artifactName: "${productName}-${version}-${os}-${arch}.${ext}"
    },
    afterSign: "notarize-retry.js"
}

module.exports = config