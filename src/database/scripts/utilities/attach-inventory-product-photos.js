require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');

const PROGRESS_PATH = path.join(__dirname, '.tmp-product-photos-progress.json');
const LIMIT = Number(process.env.PHOTO_LIMIT || 0);
const CONCURRENCY = Number(process.env.PHOTO_CONCURRENCY || 2);

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.AWS_S3_BUCKET || 'sin-customer-documents';

const imageCache = new Map();

function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) {
    return { done: {}, skipped: {}, failed: {} };
  }
  return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function buildQueries(product) {
  const name = String(product.name || '').replace(/\s+/g, ' ').trim();
  const sku = String(product.sku || '').trim();
  const external = String(product.external_sku || '').trim();
  const queries = [];

  if (name) queries.push(name);

  const cleaned = name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+\/\d+\b/g, ' ')
    .replace(/\b\d+(\.\d+)?\s*(MM|CM|KG|ML|OZ|PZA|PTO)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned && cleaned !== name) queries.push(cleaned);

  if (sku && sku.length >= 4) queries.push(`${cleaned || name} ${sku}`.trim());
  if (external && external.length >= 4) queries.push(`${cleaned || name} ${external}`.trim());

  const brandish = cleaned.split(' ').slice(0, 4).join(' ');
  if (brandish.length >= 8) queries.push(brandish);

  return [...new Set(queries.filter((q) => q.length >= 4))];
}

async function duckDuckGoImages(query) {
  const home = await fetch(
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`,
    { headers: { 'User-Agent': UA } },
  );
  const html = await home.text();
  const vqd = html.match(/vqd=['"]([^'"]+)['"]/)?.[1];
  if (!vqd) return [];

  const img = await fetch(
    `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&f=,,,,&p=1`,
    { headers: { 'User-Agent': UA, Referer: 'https://duckduckgo.com/' } },
  );
  const text = await img.text();
  try {
    const data = JSON.parse(text);
    return (data.results || [])
      .map((r) => r.image)
      .filter((url) => typeof url === 'string' && /^https?:\/\//.test(url));
  } catch {
    return [];
  }
}

function sniffMime(buffer, headerType) {
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return 'image/png';
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return 'image/gif';
  if (buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }
  if (headerType && headerType.startsWith('image/')) return headerType.split(';')[0];
  return null;
}

function extFromMime(mime) {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/gif') return 'gif';
  return 'jpg';
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: 'image/*,*/*;q=0.8' },
    redirect: 'follow',
  });
  if (!res.ok) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 4000 || buf.length > 8_000_000) return null;
  const mime = sniffMime(buf, res.headers.get('content-type'));
  if (!mime) return null;
  return { buffer: buf, mime };
}

async function findImage(product) {
  const queries = buildQueries(product);
  for (const query of queries) {
    if (imageCache.has(query)) {
      const cached = imageCache.get(query);
      if (cached) return cached;
      continue;
    }
    const urls = await duckDuckGoImages(query);
    await sleep(250);
    for (const url of urls.slice(0, 5)) {
      try {
        const img = await downloadImage(url);
        if (img) {
          imageCache.set(query, img);
          return img;
        }
      } catch {
        // try next url
      }
    }
    imageCache.set(query, null);
  }
  return null;
}

async function uploadPhoto(product, img) {
  const ext = extFromMime(img.mime);
  const key = `${product.tenant_id}/products/${product.id}/photo/${randomUUID()}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: img.buffer,
      ContentType: img.mime,
      ServerSideEncryption: 'AES256',
    }),
  );
  return key;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function mapPool(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return ret;
}

(async () => {
  const progress = loadProgress();
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  });

  const [products] = await c.query(
    `
    SELECT p.id, p.tenant_id, p.sku, p.external_sku, p.name
    FROM products p
    INNER JOIN (
      SELECT DISTINCT product_id
      FROM inv_s_batches
      WHERE available_quantity > 0
    ) b ON b.product_id = p.id
    WHERE p.photo IS NULL OR p.photo = ''
    ORDER BY p.name
    ${LIMIT > 0 ? 'LIMIT ?' : ''}
    `,
    LIMIT > 0 ? [LIMIT] : [],
  );

  const pending = products.filter((p) => !progress.done[p.id] && !progress.skipped[p.id]);
  console.log(
    `Total sin foto: ${products.length}. Pendientes: ${pending.length}. Concurrencia: ${CONCURRENCY}`,
  );

  let ok = 0;
  let skip = 0;
  let fail = 0;

  await mapPool(pending, CONCURRENCY, async (product, idx) => {
    try {
      const img = await findImage(product);
      if (!img) {
        progress.skipped[product.id] = { name: product.name, sku: product.sku };
        skip += 1;
        console.log(`[${idx + 1}/${pending.length}] SKIP ${product.sku} ${product.name}`);
      } else {
        const key = await uploadPhoto(product, img);
        await c.query('UPDATE products SET photo = ?, updated_at = NOW() WHERE id = ?', [
          key,
          product.id,
        ]);
        progress.done[product.id] = { name: product.name, sku: product.sku, photo: key };
        ok += 1;
        console.log(`[${idx + 1}/${pending.length}] OK ${product.sku} ${product.name}`);
      }
    } catch (err) {
      fail += 1;
      progress.failed[product.id] = {
        name: product.name,
        sku: product.sku,
        error: err.message,
      };
      console.log(`[${idx + 1}/${pending.length}] FAIL ${product.sku} ${err.message}`);
    }

    if ((ok + skip + fail) % 10 === 0) {
      saveProgress(progress);
    }
  });

  saveProgress(progress);
  await c.end();
  console.log(JSON.stringify({ ok, skip, fail, doneTotal: Object.keys(progress.done).length }));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
