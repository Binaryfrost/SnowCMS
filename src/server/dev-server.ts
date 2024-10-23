import { WebSocketServer } from 'ws';
import { updateManifest } from './manifest';

let wss: WebSocketServer;

async function reload() {
  await updateManifest();

  if (wss) {
    wss.clients.forEach((c) => {
      if (c.OPEN) {
        c.close();
      }
    });
  }
}

process.on('message', (msg) => {
  if (msg === 'CLIENT') {
    reload();
  }
});

export default function devServer(port: number) {
  // eslint-disable-next-line no-new
  wss = new WebSocketServer({
    port,
    path: '/dev'
  });
}
