/* =========================================================
   POST /api/send-booking
   Emails a booking enquiry straight to the trip desk through a
   normal mailbox (Gmail / Google Workspace / any SMTP) — no paid
   service. Runs as a free Vercel serverless function, and locally
   through server.js.

   Environment variables
     SMTP_USER   mailbox that sends the email, e.g. yourname@gmail.com   (required)
     SMTP_PASS   its app password (Gmail: 16-character App Password)     (required)
     SMTP_HOST   default smtp.gmail.com
     SMTP_PORT   default 465
     BOOKING_TO  where enquiries go, default paramveer.sarangdevot@hoicko.ai
     SEND_CUSTOMER_CONFIRMATION  "0" to stop the confirmation email to the customer
     MAIL_DRY_RUN  "1" to build the email without sending (testing)

   GET /api/send-booking          → is email configured?
   GET /api/send-booking?verify=1 → also test the SMTP login (sends nothing)
   ========================================================= */
const nodemailer = require('nodemailer');

const BRAND = 'Mumal Tour & Travels';
const DESK_PHONE = '+91 79762 79155';
const TO = process.env.BOOKING_TO || 'paramveer.sarangdevot@hoicko.ai';

/* ---------- helpers ---------- */
const hits = new Map(); // best-effort rate limit per IP (per function instance)
function limited(key, max, windowMs) {
  const now = Date.now();
  const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return list.length > max;
}

function transporter() {
  if (process.env.MAIL_DRY_RUN === '1') return nodemailer.createTransport({ jsonTransport: true });
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass: pass.replace(/\s+/g, '') }, // Gmail shows app passwords with spaces
  });
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const line = (v, max = 200) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, max);
const block = (v, max = 2000) => String(v ?? '').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, ' ').trim().slice(0, max);
const int = (v, lo, hi) => Math.min(hi, Math.max(lo, parseInt(v, 10) || lo));

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return JSON.parse(String(req.body) || '{}');
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > 64 * 1024) throw new Error('too_large');
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

/* ---------- email templates ---------- */
function rows(d) {
  return [
    ['Customer', d.name],
    ['Mobile', d.phone],
    ['Email', d.email || '—'],
    ['Vehicle', d.vehicle + (d.vehicles > 1 ? ` × ${d.vehicles}` : '')],
    ['Occasion', d.occasion || '—'],
    ['Trip type', d.trip || '—'],
    ['Pickup', d.pickup],
    ['Destination', d.drop || '—'],
    ['Travel date', d.date],
    ...(d.ret ? [['Return date', d.ret]] : []),
    ['Guests', String(d.guests)],
    ['Add-ons', d.addons.length ? d.addons.join(', ') : 'None'],
    ['Notes', d.notes || '—'],
  ];
}

function deskText(d, ref, when) {
  return [`New booking enquiry — ${BRAND}`, `Ref: ${ref}`, `Received: ${when}`, '', ...rows(d).map(([k, v]) => `${k}: ${v}`), '', 'Sent from the website booking form.'].join('\n');
}

function deskHtml(d, ref, when, site) {
  const digits = d.phone.replace(/\D/g, '');
  const wa = digits.length === 10 ? '91' + digits : digits;
  const btn = (href, label, bg, color) => `<a href="${esc(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 18px;border-radius:999px;background:${bg};color:${color};font-weight:bold;font-size:14px;text-decoration:none">${label}</a>`;
  const tr = rows(d).map(([k, v], i) => `
      <tr>
        <td style="padding:11px 14px;width:120px;color:#76666b;font-size:13px;vertical-align:top;background:${i % 2 ? '#ffffff' : '#faf6ee'}">${esc(k)}</td>
        <td style="padding:11px 14px;color:#2a1d21;font-size:14px;font-weight:bold;vertical-align:top;white-space:pre-line;word-break:break-word;background:${i % 2 ? '#ffffff' : '#faf6ee'}">${esc(v)}</td>
      </tr>`).join('');
  return `<!doctype html><html><body style="margin:0;background:#f3eadb">
  <div style="padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border-collapse:separate">
      <tr><td style="background:#120b0d;padding:22px 26px">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:6px;color:#f3d68e">MUMAL</div>
        <div style="font-size:11px;letter-spacing:3px;color:#d6a548;margin-top:4px">TOUR &amp; TRAVELS · UDAIPUR</div>
      </td></tr>
      <tr><td style="padding:24px 26px 6px">
        <div style="font-size:12px;letter-spacing:2px;color:#b8862f;font-weight:bold">NEW BOOKING ENQUIRY</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#2a1d21;margin-top:6px">${esc(d.vehicle)}${d.vehicles > 1 ? ` × ${d.vehicles}` : ''}</div>
        <div style="color:#76666b;font-size:14px;margin-top:6px">Ref <b style="color:#6d1426">${esc(ref)}</b> · ${esc(d.date)} · ${d.guests} guests</div>
      </td></tr>
      <tr><td style="padding:16px 26px 4px">
        ${btn('tel:+' + wa, 'Call customer', '#120b0d', '#f3d68e')}
        ${btn('https://wa.me/' + wa, 'WhatsApp customer', '#25d366', '#ffffff')}
        ${d.email ? btn('mailto:' + d.email + '?subject=' + encodeURIComponent('Your booking ' + ref + ' — ' + BRAND), 'Reply by email', '#d6a548', '#120b0d') : ''}
      </td></tr>
      <tr><td style="padding:10px 26px 26px">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #eadfcd;border-radius:12px;overflow:hidden;border-collapse:separate">${tr}
        </table>
        <div style="color:#76666b;font-size:12px;margin-top:14px">Received ${esc(when)} · Hit “Reply” to answer the customer directly.</div>
      </td></tr>
    </table>
    <p style="text-align:center;color:#76666b;font-size:12px;margin:16px 0 0">Sent from the booking form on ${esc(site)}</p>
  </div></body></html>`;
}

function customerHtml(d, ref) {
  return `<!doctype html><html><body style="margin:0;background:#f3eadb">
  <div style="padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
      <tr><td style="background:#120b0d;padding:22px 26px">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;letter-spacing:6px;color:#f3d68e">MUMAL</div>
        <div style="font-size:11px;letter-spacing:3px;color:#d6a548;margin-top:4px">TOUR &amp; TRAVELS · UDAIPUR</div>
      </td></tr>
      <tr><td style="padding:26px">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#2a1d21">Thank you, ${esc(d.name.split(' ')[0])}!</div>
        <p style="color:#4a3b3f;font-size:15px;line-height:1.6">We've received your booking request <b style="color:#6d1426">${esc(ref)}</b> for the <b>${esc(d.vehicle)}</b> on <b>${esc(d.date)}</b>.</p>
        <p style="color:#4a3b3f;font-size:15px;line-height:1.6">Our trip desk will call or WhatsApp you on <b>${esc(d.phone)}</b> within 30 minutes to confirm availability and your trip plan.</p>
        <p style="color:#4a3b3f;font-size:15px;line-height:1.6">Need us sooner? Call or WhatsApp <b>${DESK_PHONE}</b>.</p>
        <p style="color:#76666b;font-size:13px;margin-top:22px">— ${BRAND}, Udaipur</p>
      </td></tr>
    </table>
  </div></body></html>`;
}

/* ---------- handler ---------- */
module.exports = async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
  const t = transporter();

  if (req.method === 'GET') {
    if (!t) return json(res, 200, { ok: false, configured: false, message: 'Email is not set up yet: add SMTP_USER and SMTP_PASS.' });
    if (!url.searchParams.has('verify')) return json(res, 200, { ok: true, configured: true, dryRun: process.env.MAIL_DRY_RUN === '1' });
    if (limited('verify:' + ip, 5, 10 * 60 * 1000)) return json(res, 429, { ok: false, error: 'rate_limited' });
    try {
      await t.verify();
      return json(res, 200, { ok: true, configured: true, smtp: 'connected' });
    } catch (e) {
      return json(res, 200, { ok: false, configured: true, smtp: 'login_failed', code: e.code || e.responseCode || 'error' });
    }
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return json(res, 405, { ok: false, error: 'method_not_allowed' });
  }
  if (limited('send:' + ip, 6, 10 * 60 * 1000)) return json(res, 429, { ok: false, error: 'rate_limited' });

  let b;
  try { b = await readBody(req); } catch { return json(res, 400, { ok: false, error: 'bad_request' }); }
  if (b._gotcha) return json(res, 200, { ok: true }); // honeypot filled → spam bot

  const d = {
    name: line(b.name, 100),
    phone: line(b.phone, 20),
    email: line(b.email, 120),
    vehicle: line(b.vehicle, 120) || 'Vehicle to suggest',
    vehicles: int(b.vehicles, 1, 50),
    occasion: line(b.occasion, 80),
    trip: line(b.trip, 60),
    pickup: line(b.pickup, 200),
    drop: line(b.drop, 200),
    date: line(b.date, 60),
    ret: line(b.ret, 60),
    guests: int(b.guests, 1, 2000),
    addons: Array.isArray(b.addons) ? b.addons.slice(0, 10).map((a) => line(a, 60)).filter(Boolean) : [],
    notes: block(b.notes, 2000),
  };
  if (d.email && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(d.email)) d.email = '';
  const missing = [];
  if (d.name.length < 2) missing.push('name');
  if (d.phone.replace(/\D/g, '').length < 10) missing.push('phone');
  if (!d.pickup) missing.push('pickup');
  if (!d.date) missing.push('date');
  if (missing.length) return json(res, 400, { ok: false, error: 'invalid', fields: missing });

  if (!t) return json(res, 503, { ok: false, error: 'not_configured' });

  const ref = /^MTT-[A-Z0-9]{3,10}$/.test(String(b.ref)) ? String(b.ref) : 'MTT-' + Date.now().toString(36).slice(-5).toUpperCase();
  const when = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST';
  const site = String(req.headers['x-forwarded-host'] || req.headers.host || 'the website');
  const fromAddr = process.env.SMTP_USER || 'website@localhost';
  const from = { name: `${BRAND} Website`, address: fromAddr };

  try {
    const info = await t.sendMail({
      from,
      to: TO,
      replyTo: d.email ? { name: d.name, address: d.email } : undefined,
      subject: `New booking ${ref} — ${d.vehicle}${d.vehicles > 1 ? ' × ' + d.vehicles : ''} · ${d.date}`,
      text: deskText(d, ref, when),
      html: deskHtml(d, ref, when, site),
    });
    if (process.env.MAIL_DRY_RUN === '1') console.log('[dry-run] desk email built:', JSON.parse(info.message).subject);

    let confirmation = false;
    if (d.email && process.env.SEND_CUSTOMER_CONFIRMATION !== '0') {
      try {
        await t.sendMail({
          from: { name: BRAND, address: fromAddr },
          to: d.email,
          replyTo: TO,
          subject: `We've received your booking request ${ref} — ${BRAND}`,
          text: `Thank you ${d.name}! We've received your booking request ${ref} for the ${d.vehicle} on ${d.date}. Our trip desk will call or WhatsApp you on ${d.phone} within 30 minutes. Need us sooner? Call or WhatsApp ${DESK_PHONE}. — ${BRAND}, Udaipur`,
          html: customerHtml(d, ref),
        });
        confirmation = true;
      } catch (e) {
        console.warn('[send-booking] customer confirmation failed:', e.message);
      }
    }
    return json(res, 200, { ok: true, ref, confirmation });
  } catch (e) {
    console.error('[send-booking] send failed:', e.code || '', e.message);
    return json(res, 502, { ok: false, error: e.code === 'EAUTH' ? 'auth_failed' : 'send_failed' });
  }
};
