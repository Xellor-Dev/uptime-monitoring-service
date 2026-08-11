const http = require("node:http");

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? "3000", 10);

function json(res, statusCode, body) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

function createServer() {
  return http.createServer((req, res) => {
    try {
      if (req.method === "GET" && req.url === "/health") {
        return json(res, 200, { status: "ok" });
      }

      return json(res, 404, { error: "Not Found" });
    } catch (error) {
      return json(res, 500, { error: "Internal Server Error" });
    }
  });
}

if (require.main === module) {
  const server = createServer();

  server.listen(DEFAULT_PORT, () => {
    process.stdout.write(`Backend listening on port ${DEFAULT_PORT}\n`);
  });
}

module.exports = {
  createServer,
};
