/**
 * Dreamy Needle — Lightweight Node.js Local Server
 * Serves static assets and provides persistent review storage to reviews.json in the folder directory.
 * Usage: node server.js [port] (default: 8000)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2], 10) || 8000;
const DIRECTORY = __dirname;
const REVIEWS_FILE = path.join(DIRECTORY, 'reviews.json');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const urlPath = req.url.split('?')[0];

  // API Route: GET /api/reviews
  if (urlPath === '/api/reviews' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    if (fs.existsSync(REVIEWS_FILE)) {
      const data = fs.readFileSync(REVIEWS_FILE, 'utf-8');
      return res.end(data || '[]');
    }
    return res.end('[]');
  }

  // API Route: POST /api/reviews
  if (urlPath === '/api/reviews' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const newReview = JSON.parse(body);
        let reviews = [];
        if (fs.existsSync(REVIEWS_FILE)) {
          try {
            reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
          } catch (e) {
            reviews = [];
          }
        }
        reviews.unshift(newReview);
        fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
        console.log(`[Review Saved] Saved review from "${newReview.name || 'Client'}" to reviews.json`);
        res.setHeader('Content-Type', 'application/json');
        return res.end(JSON.stringify({ success: true, reviews }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // API Route: DELETE /api/reviews?id=...
  if (urlPath === '/api/reviews' && req.method === 'DELETE') {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const reviewId = urlObj.searchParams.get('id');
    let reviews = [];
    if (fs.existsSync(REVIEWS_FILE)) {
      try {
        reviews = JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf-8'));
      } catch (e) {
        reviews = [];
      }
    }
    const beforeCount = reviews.length;
    reviews = reviews.filter(r => String(r.id) !== String(reviewId));
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2), 'utf-8');
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ success: true, removed: beforeCount - reviews.length, reviews }));
  }

  // Static File Serving
  let relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  let filePath = path.join(DIRECTORY, decodeURIComponent(relativePath));

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('404 Not Found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Dreamy Needle studio running at http://localhost:${PORT}`);
  console.log(`Serving files from ${DIRECTORY}`);
  console.log(`Reviews saved to ${REVIEWS_FILE}`);
});
