import { WebSocketServer } from 'ws';

export default function devServer(port: number) {
  // eslint-disable-next-line no-new
  new WebSocketServer({
    port,
    path: '/dev'
  });
}
