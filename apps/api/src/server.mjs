import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

export function requestHandler(req, res) {
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'GET' && pathname === '/healthz') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', service: 'madising-api-foundation' }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'not_found' }));
}

export function createAppServer() {
  return createServer(requestHandler);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number.parseInt(process.env.PORT ?? '3001', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port');
  }
  createAppServer().listen(port, '127.0.0.1', () => {
    console.log(`MADISING foundation health service listening on localhost:${port}`);
  });
}
