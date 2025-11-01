const http = require('http');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');

program
  .option('-h, --host <host>', 'адреса сервера')
  .option('-p, --port <port>', 'порт сервера')
  .option('-c, --cache <path>', 'шлях до директорії кешу');

program.parse();
const options = program.opts();

if (!options.host || !options.port || !options.cache) {
  console.error('Помилка: потрібно вказати --host, --port і --cache');
  process.exit(1);
}

if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.pathname.slice(1); 
  const filePath = path.join(options.cache, `${code}.jpg`);

  try {
    if (req.method === 'GET') {
      try {
        const data = await fs.promises.readFile(filePath);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(data);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: зображення не знайдено');
      }

    } else if (req.method === 'PUT') {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', async () => {
        const body = Buffer.concat(chunks);
        await fs.promises.writeFile(filePath, body);
        res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('201 Created: зображення збережено');
      });

    } else if (req.method === 'DELETE') {
      try {
        await fs.promises.unlink(filePath);
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('200 OK: зображення видалено');
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 Not Found: зображення не знайдено');
      }

    } else {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('405 Method Not Allowed');
    }

  } catch (err) {
    console.error('Помилка обробки запиту:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено: http://${options.host}:${options.port}`);
});
