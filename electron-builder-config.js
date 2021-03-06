require('dotenv').config()

const config = {
    appId: "app.kloak.seguro",
    productName: "Seguro",
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
        "!public",
        "!build-tools"
    ],
    nsis: {
        oneClick: false,
        installerIcon: "public/seguro.ico"
    },
    win: {
        icon: "public/seguro.ico",
        target: "nsis",
        artifactName: "Seguro-${version}.exe"
    },
    mac: {
        category: "public.app-category.utilities",
        entitlements: "build-tools/entitlements.mac.plist",
        entitlementsInherit: "build-tools/entitlements.mac.plist",
        hardenedRuntime: true,
        gatekeeperAssess: false,
        icon: "public/seguro.icns",
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
        ],
        icon: "public/seguro.icns",
    },
    afterSign: "build-tools/notarize.js"
}

module.exports = config