const http = require('http');
const { program } = require('commander');
const fs = require('fs');

program
  .option('-h, --host <host>')
  .option('-p, --port <port>')
  .option('-c, --cache <path>');

program.parse();
const options = program.opts();

if (!options.host || !options.port || !options.cache) {
  console.log('Помилка: потрібно вказати --host, --port і --cache');
  process.exit(1);
}

const server = http.createServer(function (req, res) {
  res.end('Server is running');
});

server.listen(options.port, options.host, function () {
  console.log(`Сервер запущено на адресі: http://${options.host}:${options.port}`);
});
