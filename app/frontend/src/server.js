const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "4173", 10);
const ROOT_DIR = path.resolve(__dirname, "..");

function sendFile(res, filePath, contentType) {
  const stream = fs.createReadStream(filePath);

  res.writeHead(200, { "Content-Type": contentType });
  stream.pipe(res);

  stream.on("error", () => {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal Server Error");
  });
}

function createServer() {
  return http.createServer((req, res) => {
    if (req.method === "GET" && (req.url === "/" || req.url === "/index.html")) {
      return sendFile(res, path.join(ROOT_DIR, "index.html"), "text/html; charset=utf-8");
    }

    if (req.method === "GET" && req.url === "/src/main.js") {
      return sendFile(
        res,
        path.join(ROOT_DIR, "src", "main.js"),
        "application/javascript; charset=utf-8",
      );
    }

    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not Found");
  });
}

if (require.main === module) {
  const server = createServer();

  server.listen(DEFAULT_PORT, () => {
    process.stdout.write(`Frontend listening on port ${DEFAULT_PORT}\n`);
  });
}

module.exports = {
  createServer,
};
