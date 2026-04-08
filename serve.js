const http = require("http");
const fs   = require("fs");
const path = require("path");

const MIME = {
  html: "text/html",
  css:  "text/css",
  js:   "application/javascript",
};

http.createServer((req, res) => {
  let urlPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(__dirname, urlPath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath).slice(1);
  res.setHeader("Content-Type", MIME[ext] || "text/plain");
  fs.createReadStream(filePath).pipe(res);

}).listen(3000, () => {
  console.log("Frontend server running at http://localhost:3000");
});
