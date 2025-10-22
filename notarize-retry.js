require('dotenv').config();
const path = require('path');
const { notarize, stapleApp } = require('@electron/notarize');

const MAX_ATTEMPTS = 50// parseInt(process.env.NOTARIZE_MAX_ATTEMPTS || '5', 10);
const BACKOFF_MS   = parseInt(process.env.NOTARIZE_BACKOFF_MS || '2000', 10); // ← 固定 2s

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function ts() { return new Date().toLocaleTimeString('en-US', { hour12: false }); }

async function notarizeWithRetry(opts) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      console.log(`[${ts()}] [notarize] attempt ${attempt}/${MAX_ATTEMPTS}`);
      await notarize(opts);
      console.log(`[${ts()}] [notarize] ✅ success`);
      return;
    } catch (err) {
      // 尽量把 notarytool 的 stderr/stdout 打出来，方便排错
      const msg = err?.message || '';
      const stderr = err?.stderr || '';
      const stdout = err?.stdout || '';
      console.warn(`[${ts()}] [notarize] ❌ failed attempt ${attempt}: ${msg}${stderr ? '\n' + stderr : ''}${stdout ? '\n' + stdout : ''}`);

      if (attempt === MAX_ATTEMPTS) throw err;
      console.log(`[${ts()}] [notarize] retrying in ${Math.round(BACKOFF_MS/1000)}s...`);
      await sleep(BACKOFF_MS); // ← 固定等待
    }
  }
}

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== 'darwin') return;
  if (!/mac-universal$/i.test(appOutDir)) {
    console.log(`[${ts()}] [notarize] skip (appOutDir=${appOutDir})`);
    return;
  }

  const productName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${productName}.app`);
  const appBundleId = process.env.APP_BUNDLE_ID || packager.appInfo.info._configuration.appId || 'CONET-Labs.CONET-Labs-SilentPass';

  const appleId = process.env.NOTARIZE_APPLE_ID;
  const password = process.env.NOTARIZE_APPLE_PASS;
  const teamId = process.env.APPLE_TEAM_ID || '23YYTMA7YQ';
  const keychainProfile = process.env.AC_PASSWORD;

  if ((!appleId || !password) && !keychainProfile) {
    console.log(`[${ts()}] [notarize] ⚠️ skip: missing NOTARIZE_APPLE_ID / NOTARIZE_APPLE_PASS`);
    return;
  }

  console.log(`[${ts()}] [notarize] 🚀 start notarization`);

  await notarizeWithRetry({
    tool: 'notarytool',
    appBundleId,
    appPath,
    appleId,
    password,                  // for @electron/notarize
    appleIdPassword: password, // 兼容 electron-notarize
    teamId,
    keychainProfile,
  });

  try {
    await stapleApp({ appPath });
    console.log(`[${ts()}] [notarize] 📎 stapled`);
  } catch (e) {
    console.warn(`[${ts()}] [notarize] staple failed:`, e?.message || e);
  }
};
