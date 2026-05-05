// Lightweight static file server - works with both Bun and Node.js
// Usage: bun server.js  OR  node server.js

const PORT = process.env.PORT || 3000;
const HOST = 'localhost';

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

// Detect runtime
const isBun = typeof Bun !== 'undefined';

if (isBun) {
  // Bun server
  const ROOT = new URL('.', import.meta.url).pathname;

  Bun.serve({
    port: PORT,
    hostname: HOST,
    fetch(req) {
      const url = new URL(req.url);
      let path = url.pathname;

      if (path === '/') path = '/index.html';
      if (path === '/favicon.ico') return new Response(null, { status: 204 });

      const safePath = path.replace(/\.\./g, '');
      const filePath = ROOT + safePath;

      try {
        const file = Bun.file(filePath);
        if (file.size > 0) {
          return new Response(file, {
            headers: {
              'Content-Type': getMimeType(filePath),
              'Cache-Control': 'public, max-age=3600'
            }
          });
        }
      } catch (e) {}

      return new Response('Not Found', { status: 404 });
    }
  });

  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log('Runtime: Bun');
} else {
  // Node.js server - simple version
  import('node:fs').then(fs => {
    import('node:path').then(pathModule => {
      import('node:http').then(http => {
        const ROOT = pathModule.default.dirname(new URL(import.meta.url).pathname);

        const server = http.default.createServer((req, res) => {
          let urlPath = req.url.split('?')[0];
          if (urlPath === '/') urlPath = '/index.html';

          const filePath = pathModule.default.join(ROOT, urlPath);

          // Security: prevent directory traversal
          if (!filePath.startsWith(ROOT)) {
            res.writeHead(403);
            res.end('Forbidden');
            return;
          }

          const mimeType = getMimeType(filePath);

          fs.default.readFile(filePath, (err, data) => {
            if (err) {
              res.writeHead(404);
              res.end('Not Found');
              return;
            }

            res.writeHead(200, {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=3600'
            });
            res.end(data);
          });
        });

        server.listen(PORT, HOST, () => {
          console.log(`Server running at http://${HOST}:${PORT}`);
          console.log('Runtime: Node.js');
        });
      });
    });
  });
}
