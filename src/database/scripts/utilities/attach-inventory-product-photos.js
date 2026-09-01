require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { randomUUID } = require('crypto');

const PHOTO_ONLY = String(process.env.PHOTO_ONLY || '').trim().toLowerCase();
const PROGRESS_PATH = path.join(
  __dirname,
  PHOTO_ONLY ? `.tmp-product-photos-${PHOTO_ONLY}-progress.json` : '.tmp-product-photos-v2-progress.json',
);
const LIMIT = Number(process.env.PHOTO_LIMIT || 0);
const CONCURRENCY = Number(process.env.PHOTO_CONCURRENCY || 2);
const TENANT_ID = process.env.PHOTO_TENANT_ID || 'afff1757-dbcf-4715-a756-6b22bb2c59d5';
const EXCLUDE =
  '-makeup -maquillaje -cosmetic -lipstick -sephora -boeing -airbus -airport -aeropuerto -jetliner';
const LUMBER_EXCLUDE =
  '-person -people -persona -portrait -retrato -furniture -mueble -cabinet -gabinete -puerta -door -sofa';
const LUMBER_CATEGORIES = new Set([
  'ALDER', 'ENCINO', 'NOGAL', 'BIRCH', 'MAPLE', 'CAOBA', 'HAYA', 'POPLAR',
  'CEDRO', 'CHERRY', 'PINO', 'FRESNO',
]);
const LUMBER_GRADE_TOKENS = new Set([
  'gabinete', 'selecto', 'comun', 'paint', 'premium', 'frame', 'custom', 'superior',
  'color', 'yield', 'shop', 'cara', 'kd', 's2s', 's3s', 's4s', 'cbc', 'plus',
]);

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

const CATEGORY_HINTS = {
  FERRETERIA: 'herramienta ferreteria carpinteria',
  CUBIERTAS: 'cubierta laminado formica tablero cocina',
  RIELES: 'riel cajon herraje mueble carpinteria',
  ACCESORIOS: 'herraje accesorio mueble carpinteria',
  ACABADOS: 'tapacanto canto PVC melamina madera',
  CORREDERAS: 'corredera riel cajon herraje mueble',
  JALADERAS: 'jaladera manija cajon mueble herraje',
  BISAGRAS: 'bisagra puerta mueble herraje carpinteria',
  'SELLADORES-LACAS': 'laca barniz sellador madera carpinteria',
  LIJAS: 'lija madera carpinteria ferreteria',
  PEGAMENTOS: 'pegamento cola madera carpinteria',
  BOTONES: 'boton mueble perilla jaladera herraje',
  CERRADURAS: 'cerradura chapa puerta herraje',
  FORMAICAS: 'formica laminado cubierta cocina',
  MDF: 'tablero MDF madera carpinteria',
  CHILILLOS: 'chilillo tornillo herraje ferreteria madera',
  RESANES: 'resane masilla madera carpinteria',
  DISCOS: 'disco corte madera sierra ferreteria',
  CLAVOS: 'clavo carpinteria ferreteria',
  'INTERIORES COCINAS': 'accesorio cocina gabinete herraje',
  MELAMINA: 'tablero melamina madera',
  GRAVADOS: 'tablero grabado madera',
  PUERTAS: 'puerta madera herraje',
  EXTERIOR: 'madera exterior barniz',
  SISTEMAS: 'sistema herraje mueble cajon',
  APLICACIONES: 'aplicador pegamento madera carpinteria',
  NOGAL: 'madera nogal tabla lumber',
  ENCINO: 'madera encino roble tabla lumber',
  BIRCH: 'madera birch abedul tabla lumber',
  MAPLE: 'madera maple tabla lumber',
  CAOBA: 'madera caoba tabla lumber',
  ALDER: 'madera alder aliso tabla lumber',
  HAYA: 'madera haya beech tabla lumber',
  POPLAR: 'madera poplar alamillo tabla lumber',
  CEDRO: 'madera cedro tabla lumber',
  CHERRY: 'madera cherry cerezo tabla lumber',
  PINO: 'madera pino tabla lumber',
  FRESNO: 'madera fresno ash tabla lumber',
};

const NAME_HINTS = [
  { re: /\bavion\b/i, hint: 'bisagra de avion herraje mueble Blum' },
  { re: /\bwing\b|\bwingline\b/i, hint: 'WingLine riel puerta herraje Hettich' },
  { re: /\bbisagra|\bbis\b|\bblum\b|\bsensys\b|\bintermat\b/i, hint: 'bisagra herraje mueble' },
  { re: /\bjaladera|\bmanija|\bboton\b|\bperilla|\bpulgar/i, hint: 'jaladera boton mueble herraje' },
  { re: /\briel|\bcorredera|\batira|\bactro|\bslideline/i, hint: 'riel cajon herraje mueble' },
  { re: /\btornillo|\bspax|\bclavo|\bchilillo|\btuerca|\bancla|\bbalero|\brodamient/i, hint: 'tornillo clavo ferreteria' },
  { re: /\blija\b/i, hint: 'lija madera carpinteria' },
  { re: /\bpegamento|\btitebond|\bcola\b|\badhes/i, hint: 'pegamento cola madera' },
  { re: /\blaca|\bbarniz|\bsellador|\bmancha|\bnitrolaca|\baceite/i, hint: 'laca barniz madera' },
  { re: /\bmdf|\bmelamina|\btriplay|\bosb|\btablero|\bchapa de\b/i, hint: 'tablero madera' },
  { re: /\bcubierta|\bform[ai]ca|\bbasi-k|\bq-sb|\bquartz/i, hint: 'cubierta formica cocina' },
  { re: /\bcerradura|\bcerrojo|\bfalcon|\bchapa\b/i, hint: 'cerradura chapa puerta herraje' },
  { re: /\bdisco\b/i, hint: 'disco corte madera sierra' },
  { re: /\bgoma|\bhule|\bbumper|\btope/i, hint: 'goma tope herraje mueble' },
  { re: /\bcinta|\btapacanto|\bpvc|\bcanto/i, hint: 'tapacanto PVC madera' },
  { re: /\bresane|\bfamowood/i, hint: 'resane madera' },
  { re: /\bnavaja|\brouter|\bamana|\btimberline|\bfresa/i, hint: 'fresa router madera carpinteria' },
  { re: /\bpiston|\bgas\b/i, hint: 'piston gas herraje mueble' },
  { re: /\bsoporte|\bescuadra/i, hint: 'escuadra soporte ferreteria' },
  { re: /\balder|\bencino|\bnogal|\bmaple|\bbirch|\bpino\b|\bcaoba|\bhaya|\bpoplar|\bcedro|\bcherry|\bfresno|\baspen|\baliso/i, hint: 'madera solida tabla lumber' },
  { re: /\bluz\b|\bled\b/i, hint: 'luz LED gabinete carpinteria' },
  { re: /\brejilla\b/i, hint: 'rejilla organizador gabinete cocina herraje' },
];

const DOMAIN_HINT = 'ferreteria herraje madera carpinteria';
const STOP = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'con', 'para', 'por', 'p', 'c', 'y', 'en', 'un', 'una',
  'the', 'mm', 'cm', 'ml', 'oz', 'pza', 'pzas', 'lto', 'kg', 'mts', 'set', 'der', 'izq',
]);
const GENERIC_TOKENS = new Set([
  'accesorio', 'accesorios', 'varios', 'articulos', 'producto', 'original', 'superior',
  'comun', 'premium', 'custom', 'industrias', 'litro',
]);

function loadProgress() {
  if (!fs.existsSync(PROGRESS_PATH)) {
    return { done: {}, skipped: {}, failed: {} };
  }
  return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

function isTestProduct(name) {
  return /\b(prueba|test)\b/i.test(name || '');
}

function cleanName(name) {
  return String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b\d+[\/xX]\d+\b/g, ' ')
    .replace(/\b\d+(\.\d+)?\s*(MM|CM|ML|OZ|PZA|PZAS|PTO|LTO|KG|MTS?|"|')\b/gi, ' ')
    .replace(/[#*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function significantTokens(name) {
  return cleanName(name)
    .split(' ')
    .filter((w) => w.length >= 3 && !STOP.has(w.toLowerCase()) && !/^\d+$/.test(w));
}

function distinctiveTokens(name) {
  return significantTokens(name).filter((w) => !GENERIC_TOKENS.has(w.toLowerCase()));
}

function lumberKind(product) {
  const name = String(product.name || '');
  const cat = String(product.category_name || '').trim().toUpperCase();
  if (/\bresane\b|\bcinta\b|\btapacanto\b|\bbisagra\b|\bjaladera\b|\bboton\b/i.test(name)) {
    return null;
  }
  const isSpecies =
    LUMBER_CATEGORIES.has(cat) ||
    /\b(alder|aliso|encino|nogal|maple|birch|pino|caoba|haya|poplar|cedro|cherry|fresno|aspen)\b/i.test(
      name,
    );
  if (!isSpecies) return null;
  if (/\b(triplay|plywood)\b/i.test(name)) return 'plywood';
  if (/\b(mdf|enchapado)\b/i.test(name)) return 'veneer';
  return 'solid';
}

function lumberSpeciesTerms(product) {
  const hay = `${product.name || ''} ${product.category_name || ''}`;
  if (/\balder\b|\baliso\b/i.test(hay)) return { en: 'alder red alder', es: 'aliso' };
  if (/\bencino\b|\boak\b/i.test(hay)) return { en: 'oak red oak', es: 'encino' };
  if (/\bnogal\b|\bwalnut\b/i.test(hay)) return { en: 'walnut', es: 'nogal' };
  if (/\bmaple\b/i.test(hay)) return { en: 'maple', es: 'maple' };
  if (/\bbirch\b|\babedul\b/i.test(hay)) return { en: 'birch', es: 'abedul' };
  if (/\bpino\b|\bpine\b/i.test(hay)) return { en: 'pine', es: 'pino' };
  if (/\bcaoba\b|\bmahogany\b/i.test(hay)) return { en: 'mahogany', es: 'caoba' };
  if (/\bhaya\b|\bbeech\b/i.test(hay)) return { en: 'beech', es: 'haya' };
  if (/\bpoplar\b|\balamillo\b/i.test(hay)) return { en: 'poplar', es: 'alamillo' };
  if (/\bcedro\b|\bcedar\b/i.test(hay)) return { en: 'cedar', es: 'cedro' };
  if (/\bcherry\b|\bcerezo\b/i.test(hay)) return { en: 'cherry', es: 'cerezo' };
  if (/\bfresno\b|\bash\b/i.test(hay)) return { en: 'ash', es: 'fresno' };
  if (/\baspen\b/i.test(hay)) return { en: 'aspen', es: 'alamo' };
  return { en: 'hardwood', es: 'madera' };
}

function categoryHint(categoryName) {
  const key = String(categoryName || '').trim().toUpperCase();
  if (!key || key === '0 POR DEFECTO' || key === 'CATEGORIA DE PRUEBA') return '';
  return CATEGORY_HINTS[key] || `${key.toLowerCase()} ferreteria madera`;
}

function nameHint(name) {
  for (const row of NAME_HINTS) {
    if (row.re.test(name || '')) return row.hint;
  }
  return '';
}

function fingerprint(product) {
  const kind = lumberKind(product);
  if (kind) {
    const sp = lumberSpeciesTerms(product).es;
    return `lumber|${sp}|${kind}`;
  }
  const tokens = significantTokens(product.name).slice(0, 4).join(' ').toLowerCase();
  const cat = String(product.category_name || '').trim().toUpperCase();
  return `${cat}|${tokens}`;
}

function buildLumberQueries(product) {
  const kind = lumberKind(product);
  const { en, es } = lumberSpeciesTerms(product);
  if (kind === 'plywood') {
    return [
      `triplay ${en} ${es} plywood madera tablero ${LUMBER_EXCLUDE}`,
      `${es} triplay plywood lumber -furniture -person`,
    ];
  }
  if (kind === 'veneer') {
    return [
      `MDF enchapado ${en} ${es} veneer plywood ${LUMBER_EXCLUDE}`,
      `MDF enchapado ${es} madera -furniture -person`,
    ];
  }
  return [
    `${en} ${es} hardwood lumber boards tabla madera aserrada S2S ${LUMBER_EXCLUDE}`,
    `madera ${es} ${en} lumber tabla hardwood mill -persona -mueble -furniture`,
    `${en} lumber grain board hardwood mill -person -furniture`,
  ];
}

function buildQueries(product) {
  if (lumberKind(product)) {
    return [...new Set(buildLumberQueries(product).map((q) => q.replace(/\s+/g, ' ').trim()))];
  }

  const name = String(product.name || '').replace(/\s+/g, ' ').trim();
  const cleaned = cleanName(name);
  const tokens = significantTokens(name);
  const cat = String(product.category_name || '').trim();
  const catOk = cat && !/^0 por defecto$/i.test(cat) && !/^categoria de prueba$/i.test(cat);
  const hint = [categoryHint(cat), nameHint(name), DOMAIN_HINT].filter(Boolean).join(' ');
  const queries = [];

  if (cleaned) {
    queries.push(`${cleaned} ${catOk ? cat : ''} ${hint} ${EXCLUDE}`.replace(/\s+/g, ' ').trim());
  }
  if (tokens.length) {
    queries.push(`${tokens.slice(0, 5).join(' ')} ${hint} ${EXCLUDE}`.replace(/\s+/g, ' ').trim());
  }
  if (catOk) {
    queries.push(`${tokens.slice(0, 3).join(' ')} ${cat} ${hint}`.replace(/\s+/g, ' ').trim());
  }

  const sku = String(product.sku || '').trim();
  if (/^[A-Z0-9-]{6,}$/i.test(sku) && /\d/.test(sku) && cleaned) {
    queries.push(`${cleaned} ${sku} ${hint}`.replace(/\s+/g, ' ').trim());
  }

  return [...new Set(queries.filter((q) => q.length >= 8))];
}

function isRejected(hay, product) {
  const t = String(hay || '').toLowerCase();
  if (
    /\b(boeing|airbus|airport|aeropuerto|cockpit|jetliner|makeup|maquillaje|lipstick|cosmetic|sephora|labial|eyeliner)\b/.test(
      t,
    )
  ) {
    return true;
  }
  const nameHasAvion = /\bavion\b/i.test(product.name || '');
  if (/\b(airplane|aircraft|aviation)\b/.test(t) && !nameHasAvion) return true;
  if (
    /\bavion\b/.test(t) &&
    !nameHasAvion &&
    !/\b(bisagra|hinge|blum|herraje|base)\b/.test(t)
  ) {
    return true;
  }
  if (lumberKind(product)) {
    if (
      /\b(person|people|persona|portrait|retrato|headshot|celebrity|fashion|rostro)\b/.test(t)
    ) {
      return true;
    }
    if (
      /\b(sofa|sillon|silla|furniture|cocina integral|kitchen cabinet|muebles? de)\b/.test(t)
    ) {
      return true;
    }
    if (/\bmueble\b/.test(t) && !/\b(lumber|tabla|hardwood|aserrada|triplay|plywood)\b/.test(t)) {
      return true;
    }
    if (/\b(puerta|door)\b/.test(t) && !/\b(lumber|tabla|hardwood|aserrada|triplay|plywood)\b/.test(t)) {
      return true;
    }
  }
  return false;
}

function scoreLumberResult(hay, product) {
  const { en, es } = lumberSpeciesTerms(product);
  const kind = lumberKind(product);
  const wood = [
    'lumber', 'hardwood', 'tabla', 'aserrada', 'maderer', 'plywood', 'triplay',
    'enchapado', 's2s', es, ...en.split(' '),
  ];
  let score = 0;
  for (const g of wood) {
    if (g && hay.includes(g.toLowerCase())) score += 4;
  }
  if (kind === 'plywood') {
    const sheet = /\btriplay\b/.test(hay) || (/\bplywood\b/.test(hay) && !/\bplywood company\b/.test(hay));
    if (!sheet) return -1;
    if (/\b(4\/4|6\/4|8\/4|rough cut)\b/.test(hay) && !/\btriplay\b/.test(hay)) return -1;
    score += 8;
  }
  if (kind === 'veneer') {
    if (!/\b(mdf|enchapado|veneer)\b/.test(hay)) return -1;
    score += 6;
  }
  if (kind === 'solid') {
    if (!/\b(lumber|tabla|aserrada|hardwood|s2s|aliso)\b/.test(hay)) return -1;
    if (/\b(triplay|plywood|mdf)\b/.test(hay) && !/\b(lumber|tabla|hardwood)\b/.test(hay)) return -1;
    score += 6;
  }
  if (score < 4) return -1;
  return score;
}

function scoreResult(result, product) {
  const hay = `${result.title || ''} ${result.url || ''}`.toLowerCase();
  if (isRejected(hay, product)) return -1;

  if (lumberKind(product)) {
    return scoreLumberResult(hay, product);
  }

  const dist = distinctiveTokens(product.name).filter(
    (w) => !LUMBER_GRADE_TOKENS.has(w.toLowerCase()),
  );
  let tokenHits = 0;
  for (const token of dist) {
    if (hay.includes(token.toLowerCase())) tokenHits += 1;
  }
  if (dist.length >= 1 && tokenHits === 0) return -1;

  let score = tokenHits * 4;
  const good = [
    'herraje', 'ferreter', 'madera', 'carpinter', 'mueble', 'bisagra', 'jaladera',
    'riel', 'tornillo', 'tablero', 'lija', 'barniz', 'pegamento', 'formica',
    'melamina', 'mdf', 'cerradura', 'clavo', 'chilillo', 'tapacanto', 'router',
    'fresa', 'lumber', 'hardware', 'cabinet', 'hinge', 'knob', 'goma', 'resane',
    'cubierta', 'laminado', 'hettich', 'blum', 'titebond',
  ];
  for (const g of good) {
    if (hay.includes(g)) score += 3;
  }
  return score;
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
    `https://duckduckgo.com/i.js?l=mx-es&o=json&q=${encodeURIComponent(query)}&vqd=${encodeURIComponent(vqd)}&f=,,,,&p=1`,
    { headers: { 'User-Agent': UA, Referer: 'https://duckduckgo.com/' } },
  );
  const text = await img.text();
  try {
    const data = JSON.parse(text);
    return data.results || [];
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
  const fp = fingerprint(product);
  if (imageCache.has(fp)) return imageCache.get(fp);

  const queries = buildQueries(product);
  for (const query of queries) {
    const results = await duckDuckGoImages(query);
    await sleep(280);
    const ranked = results
      .map((r) => ({ ...r, score: scoreResult(r, product) }))
      .filter((r) => r.score >= 2 && typeof r.image === 'string' && /^https?:\/\//.test(r.image))
      .sort((a, b) => b.score - a.score);

    for (const row of ranked.slice(0, 6)) {
      try {
        const img = await downloadImage(row.image);
        if (img) {
          const found = { ...img, title: row.title || '', query };
          imageCache.set(fp, found);
          return found;
        }
      } catch {
        // siguiente url
      }
    }
  }

  imageCache.set(fp, null);
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
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    connectionLimit: Math.max(4, CONCURRENCY + 2),
  });

  const [products] = await pool.query(
    `
    SELECT p.id, p.tenant_id, p.sku, p.external_sku, p.name, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.tenant_id = ?
    ORDER BY p.name
    ${LIMIT > 0 ? 'LIMIT ?' : ''}
    `,
    LIMIT > 0 ? [TENANT_ID, LIMIT] : [TENANT_ID],
  );

  const pending = products.filter((p) => {
    if (progress.done[p.id] || progress.skipped[p.id] || isTestProduct(p.name)) return false;
    if (!PHOTO_ONLY) return true;
    if (PHOTO_ONLY === 'alder') {
      if (/\bresane\b/i.test(p.name)) return false;
      return /\balder\b|\baliso\b/i.test(p.name) || /^ALDER$/i.test(p.category_name || '');
    }
    return String(p.category_name || '').toLowerCase() === PHOTO_ONLY;
  });
  console.log(
    `Total: ${products.length}. Pendientes: ${pending.length}. Concurrencia: ${CONCURRENCY}`,
  );

  let ok = 0;
  let skip = 0;
  let fail = 0;

  await mapPool(pending, CONCURRENCY, async (product, idx) => {
    try {
      const img = await findImage(product);
      if (!img) {
        progress.skipped[product.id] = {
          name: product.name,
          sku: product.sku,
          category: product.category_name,
        };
        skip += 1;
        console.log(`[${idx + 1}/${pending.length}] SKIP ${product.sku} ${product.name}`);
      } else {
        const key = await uploadPhoto(product, img);
        await pool.query('UPDATE products SET photo = ?, updated_at = NOW() WHERE id = ?', [
          key,
          product.id,
        ]);
        progress.done[product.id] = {
          name: product.name,
          sku: product.sku,
          category: product.category_name,
          photo: key,
          title: img.title,
        };
        ok += 1;
        console.log(
          `[${idx + 1}/${pending.length}] OK ${product.sku} ${product.name} | ${String(img.title || '').slice(0, 80)}`,
        );
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

    if ((ok + skip + fail) % 8 === 0) {
      saveProgress(progress);
    }
  });

  saveProgress(progress);
  await pool.end();
  console.log(JSON.stringify({ ok, skip, fail, doneTotal: Object.keys(progress.done).length }));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
