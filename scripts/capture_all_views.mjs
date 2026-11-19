import { spawn } from 'node:child_process';
import fs from 'node:fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const brainDir = 'C:\\Users\\Acer\\.gemini\\antigravity\\brain\\20a9971b-e58a-43e6-b482-48436e3bae68';

const chrome = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--disable-gpu',
  '--window-size=1440,1000',
  'http://127.0.0.1:3000/#/'
]);

await new Promise(r => setTimeout(r, 2000));

try {
  const versionRes = await fetch('http://127.0.0.1:9225/json/list');
  const tabs = await versionRes.json();
  const pageTab = tabs.find(t => t.type === 'page');
  if (!pageTab) {
    console.log('No page tab found');
    process.exit(1);
  }

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);

  let id = 1;
  function send(method, params = {}) {
    return new Promise(resolve => {
      const msgId = id++;
      const handler = (evt) => {
        const data = JSON.parse(evt.data);
        if (data.id === msgId) {
          ws.removeEventListener('message', handler);
          resolve(data.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  async function snap(url, width, height, mobile, filename) {
    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: mobile ? 2 : 1,
      mobile: !!mobile
    });
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1600));
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${brainDir}\\${filename}`, Buffer.from(shot.data, 'base64'));
    console.log(`[CAPTURED] ${filename}`);
  }

  // 1. Homepage
  await snap('http://127.0.0.1:3000/#/', 1440, 900, false, 'homepage_desktop_1440.png');
  await snap('http://127.0.0.1:3000/#/', 1280, 800, false, 'homepage_laptop_1280.png');
  await snap('http://127.0.0.1:3000/#/', 768, 1024, false, 'homepage_tablet_768.png');
  await snap('http://127.0.0.1:3000/#/', 390, 844, true, 'homepage_mobile_390.png');

  // 2. Games Catalog
  await snap('http://127.0.0.1:3000/#/games', 1440, 900, false, 'catalog_desktop_1440.png');
  await snap('http://127.0.0.1:3000/#/games', 390, 844, true, 'catalog_mobile_390.png');

  // 3. Game Detail
  await snap('http://127.0.0.1:3000/#/games/game_001', 1440, 1000, false, 'detail_desktop_1440.png');
  await snap('http://127.0.0.1:3000/#/games/game_001', 390, 844, true, 'detail_mobile_390.png');

  // 4. Player Dashboard
  await snap('http://127.0.0.1:3000/#/player/dashboard', 1440, 900, false, 'player_dashboard_1440.png');
  await snap('http://127.0.0.1:3000/#/player/dashboard', 390, 844, true, 'player_dashboard_390.png');

  // 5. DM Dashboard
  await snap('http://127.0.0.1:3000/#/dm/dashboard', 1440, 900, false, 'dm_dashboard_1440.png');

  // 6. Admin Dashboard
  await snap('http://127.0.0.1:3000/#/admin/dashboard', 1440, 900, false, 'admin_dashboard_1440.png');

  ws.close();
} finally {
  chrome.kill();
}
