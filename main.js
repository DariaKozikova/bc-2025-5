const http = require('http');
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const superagent = require('superagent');

program
  .option('-h, --host <host>')
  .option('-p, --port <port>')
  .option('-c, --cache <path>');

program.parse();
const options = program.opts();

if (!options.host || !options.port || !options.cache) {
  console.error('Потрібно вказати --host, --port, --cache');
  process.exit(1);
}

if (!fs.existsSync(options.cache)) {
  fs.mkdirSync(options.cache, { recursive: true });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const code = url.pathname.slice(1);
  const filePath = path.join(options.cache, `${code}.jpg`);

  if (req.method === 'GET') {
    try {
      const data = await fs.promises.readFile(filePath);
      res.writeHead(200, { 'Content-Type': 'image/jpeg' });
      res.end(data);
    } catch {
      try {
        const response = await superagent.get(`https://http.cat/${code}`);
        const imageBuffer = response.body;
        await fs.promises.writeFile(filePath, imageBuffer);
        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.end(imageBuffer);
      } catch {
        res.writeHead(404);
        res.end('404');
      }
    }

  } else if (req.method === 'PUT') {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', async () => {
      const body = Buffer.concat(chunks);
      await fs.promises.writeFile(filePath, body);
      res.writeHead(201);
      res.end('201');
    });

  } else if (req.method === 'DELETE') {
    try {
      await fs.promises.unlink(filePath);
      res.writeHead(200);
      res.end('200 OK');
    } catch {
      res.writeHead(404);
      res.end('404');
    }

  } else {
    res.writeHead(405);
    res.end('405');
  }
});

server.listen(options.port, options.host, () => {
  console.log(`Сервер запущено: http://${options.host}:${options.port}`);
});
