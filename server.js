/* =========================================================
   Local development server
   Serves the website and runs the booking email function exactly
   like Vercel does.   Usage:  npm run dev   →  http://localhost:5173
   Email settings are read from a .env file (see .env.example).
   ========================================================= */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Load .env (KEY=value per line) without extra dependencies
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const raw of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = raw.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const sendBooking = require('./api/send-booking');

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2',
};
const PRIVATE = /(^|[\\/])(\.|node_modules|api|server\.js|package(-lock)?\.json|_source-png)/;

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/api/send-booking') {
    try { return await sendBooking(req, res); } catch (e) { console.error(e); res.statusCode = 500; return res.end('{"ok":false}'); }
  }
  let rel;
  try { rel = path.normalize(decodeURIComponent(pathname)).replace(/^[\\/]+/, ''); } catch { rel = ''; }
  if (rel === '' || rel.endsWith(path.sep)) rel = path.join(rel, 'index.html');
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT + path.sep) || PRIVATE.test(rel)) { res.statusCode = 404; return res.end('Not found'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    fs.createReadStream(file).pipe(res);
  });
}).listen(process.env.PORT || 5173, () => {
  const port = process.env.PORT || 5173;
  const mail = process.env.MAIL_DRY_RUN === '1' ? 'DRY RUN (emails are built but not sent)' : process.env.SMTP_USER ? `sending as ${process.env.SMTP_USER}` : 'NOT SET UP — add SMTP_USER and SMTP_PASS to .env';
  console.log(`\n  Mumal website →  http://localhost:${port}\n  Booking email →  ${mail}\n`);
});
