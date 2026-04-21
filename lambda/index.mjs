import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: process.env.BUCKET_REGION || 'us-east-2' });
const BUCKET = process.env.BUCKET_NAME || 'ynk-techusa';

const COLLECTIONS = {
  'access-requests': 'data/access-requests.json',
  'dynamic-codes':   'data/dynamic-codes.json',
  'site-stats':      'data/site-stats.json',
  'access-events':   'data/access-events.json',
};

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function respond(statusCode, body) {
  return {
    statusCode,
    headers: { ...CORS, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function readS3(key) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body.transformToString());
  } catch (e) {
    if (e.name === 'NoSuchKey') return key.includes('stats') ? {} : [];
    throw e;
  }
}

async function writeS3(key, data) {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
  }));
}

function sanitize(str, maxLen) {
  return String(str || '').slice(0, maxLen);
}

export async function handler(event) {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path   = event.requestContext?.http?.path   || event.path;

  // CORS preflight
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }

  try {
    // ── GET /api/data/{collection} ──────────────────
    if (method === 'GET' && path.startsWith('/api/data/')) {
      const collection = path.replace('/api/data/', '');
      const s3Key = COLLECTIONS[collection];
      if (!s3Key) return respond(404, { error: 'Unknown collection' });
      const data = await readS3(s3Key);
      return respond(200, data);
    }

    // ── POST /api/access-requests ───────────────────
    if (method === 'POST' && path === '/api/access-requests') {
      const body = JSON.parse(event.body || '{}');
      if (!body.name || !body.email || !body.industry || !body.reason) {
        return respond(400, { error: 'Missing required fields: name, email, industry, reason' });
      }
      const requests = await readS3(COLLECTIONS['access-requests']);
      requests.push({
        name:     sanitize(body.name, 100),
        email:    sanitize(body.email, 100),
        company:  sanitize(body.company || 'N/A', 100),
        industry: sanitize(body.industry, 50),
        reason:   sanitize(body.reason, 500),
        id:       'req_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
        status:   'pending',
        date:     new Date().toISOString(),
      });
      await writeS3(COLLECTIONS['access-requests'], requests);
      return respond(201, { ok: true });
    }

    // ── PATCH /api/access-requests/{id} ─────────────
    if (method === 'PATCH' && path.startsWith('/api/access-requests/')) {
      const id = path.replace('/api/access-requests/', '');
      if (!id) return respond(400, { error: 'Missing request id' });
      const updates = JSON.parse(event.body || '{}');
      const requests = await readS3(COLLECTIONS['access-requests']);
      const req = requests.find(r => r.id === id);
      if (!req) return respond(404, { error: 'Request not found' });
      // Only allow specific fields to be updated
      const allowed = ['status', 'approvedCode', 'approvedDate', 'approvedIndustry', 'deniedDate', 'disabledDate', 'archivedDate', 'expiresAt'];
      for (const key of allowed) {
        if (updates[key] !== undefined) req[key] = updates[key];
      }
      await writeS3(COLLECTIONS['access-requests'], requests);
      return respond(200, { ok: true });
    }

    // ── DELETE /api/dynamic-codes/{hash} ─────────────
    if (method === 'DELETE' && path.startsWith('/api/dynamic-codes/')) {
      const hash = decodeURIComponent(path.replace('/api/dynamic-codes/', ''));
      if (!hash) return respond(400, { error: 'Missing hash' });
      const codes = await readS3(COLLECTIONS['dynamic-codes']);
      const filtered = codes.filter(c => c.hash !== hash);
      await writeS3(COLLECTIONS['dynamic-codes'], filtered);
      return respond(200, { ok: true });
    }

    // ── POST /api/dynamic-codes ─────────────────────
    if (method === 'POST' && path === '/api/dynamic-codes') {
      const body = JSON.parse(event.body || '{}');
      if (!body.hash || !body.industry) {
        return respond(400, { error: 'Missing required fields: hash, industry' });
      }
      const codes = await readS3(COLLECTIONS['dynamic-codes']);
      codes.push({
        hash:     sanitize(body.hash, 128),
        industry: sanitize(body.industry, 50),
        file:     sanitize(body.file || '', 200),
        icon:     sanitize(body.icon || '', 10),
        name:     sanitize(body.name || '', 100),
        email:    sanitize(body.email || '', 100),
        created:  body.created || new Date().toISOString(),
      });
      await writeS3(COLLECTIONS['dynamic-codes'], codes);
      return respond(201, { ok: true });
    }

    // ── POST /api/track ─────────────────────────────
    if (method === 'POST' && path === '/api/track') {
      const body = JSON.parse(event.body || '{}');
      const page = sanitize(body.page, 50);
      if (!page) return respond(400, { error: 'Missing page' });

      const stats = await readS3(COLLECTIONS['site-stats']);
      if (!stats.pageViews)  stats.pageViews  = {};
      if (!stats.dailyViews) stats.dailyViews = {};

      const today = new Date().toISOString().slice(0, 10);
      stats.pageViews[page] = (stats.pageViews[page] || 0) + 1;
      stats.totalViews      = (stats.totalViews || 0) + 1;

      if (!stats.dailyViews[today]) stats.dailyViews[today] = {};
      stats.dailyViews[today][page]   = (stats.dailyViews[today][page] || 0) + 1;
      stats.dailyViews[today]._total  = (stats.dailyViews[today]._total || 0) + 1;
      stats.lastVisit = new Date().toISOString();

      // Keep only last 30 days
      const days = Object.keys(stats.dailyViews).sort();
      while (days.length > 30) { delete stats.dailyViews[days.shift()]; }

      await writeS3(COLLECTIONS['site-stats'], stats);
      return respond(200, { ok: true });
    }

    // ── POST /api/track-event ─────────────────────────────
    if (method === 'POST' && path === '/api/track-event') {
      const body = JSON.parse(event.body || '{}');
      const allowed = ['access_code', 'login_attempt', 'cookie_consent', 'chat_interaction'];
      if (!body.type || !allowed.includes(body.type)) {
        return respond(400, { error: 'Invalid or missing event type' });
      }
      const events = await readS3(COLLECTIONS['access-events']);
      const safeEvent = {
        type:      sanitize(body.type, 30),
        timestamp: body.timestamp || new Date().toISOString(),
      };
      if (body.type === 'access_code') {
        safeEvent.industry = sanitize(body.industry || '', 50);
        safeEvent.action   = sanitize(body.action   || '', 30);
      } else if (body.type === 'login_attempt') {
        safeEvent.success = Boolean(body.success);
      } else if (body.type === 'cookie_consent') {
        safeEvent.choice = sanitize(body.choice || '', 20);
      } else if (body.type === 'chat_interaction') {
        safeEvent.question     = sanitize(body.question     || '', 200);
        safeEvent.responseType = sanitize(body.responseType || '', 30);
      }
      if (body.location && typeof body.location === 'object') {
        safeEvent.location = {
          city:    sanitize(body.location.city    || '', 100),
          region:  sanitize(body.location.region  || '', 100),
          country: sanitize(body.location.country || '', 100),
          ip:      sanitize(body.location.ip      || '', 45),
        };
      }
      if (body.userAgent) safeEvent.userAgent = sanitize(body.userAgent, 200);
      events.push(safeEvent);
      if (events.length > 1000) events.splice(0, events.length - 1000);
      await writeS3(COLLECTIONS['access-events'], events);
      return respond(201, { ok: true });
    }

    return respond(404, { error: 'Not found' });
  } catch (err) {
    console.error('Lambda error:', err);
    return respond(500, { error: 'Internal server error' });
  }
}
