const { Pool } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config();

const product = (id, name, productCode, category, imageUrl, price, description) => ({
  id,
  name,
  product_code: productCode,
  category,
  image_url: imageUrl,
  price,
  description,
  is_active: true,
  created_at: new Date(),
  updated_at: new Date()
});

// In-memory catalogue used when PostgreSQL is unavailable.
// These entries match the clinic's supplied PRODUCT REPORT.
let inMemoryProducts = [
  product(1, 'HAIRIVA SERUM', '10014', 'Hair Serum', '/products/hairiva-serum.png', 1345.00, 'Advanced hair serum for deep nourishment, shine and frizz control.'),
  product(2, 'Hair Mask', '10027', 'Hair Treatment', '/products/hair-mask.png', 1245.00, 'Deep conditioning hair mask for soft, smooth and manageable hair.'),
  product(3, 'HAIRCIN TABLET', '10027', 'Supplement', '/products/haircin-tablet.png', 210.00, 'Hair supplement tablet with essential vitamins and minerals for healthy hair growth.'),
  product(4, 'MINOXYTOP F 2', '10037', 'Hair Growth', '/products/minoxytop-f2.png', 1075.00, 'Hair growth solution for thinning and hair-loss concerns.'),
  product(5, 'DA Moisturizer', '10038', 'Skin Care', '/products/da-moisturizer.png', 1245.00, 'Lightweight daily moisturizer for soft and hydrated skin.'),
  product(6, 'DA SPF SUNSCREEN', '10039', 'Skin Care', '/products/da-spf-sunscreen.png', 1245.00, 'Daily sunscreen for broad-spectrum UV protection.'),
  product(7, 'DA NIGHT CREAM', '10040', 'Skin Care', '/products/da-night-cream.png', 3945.00, 'Overnight cream for moisturising and supporting the skin barrier.'),
  product(8, 'DA FACE WASH', '10041', 'Skin Care', '/products/da-face-wash.png', 1295.00, 'Gentle face wash that cleanses without stripping natural oils.'),
  product(9, 'MINOXYTOP 5', '10049', 'Hair Growth', '/products/minoxytop-5.png', 725.00, 'Topical hair and scalp-care solution.'),
  product(10, 'Hair Fact AA 2', '10052', 'Supplement', '/products/hair-fact-aa2.png', 2946.00, 'Amino-acid hair supplement for use as directed by the clinic.'),
  product(11, 'NEW MOCOTROY PLUS TAB', '10053', 'Supplement', '/products/new-mocotroy-plus-tab.png', 219.60, 'Multivitamin supplement for use as directed by the clinic.'),
  product(12, 'Advance Hair Growth Shampoo 200Ml', '10054', 'Hair Care', '/products/advance-hair-growth-shampoo-200ml.png', 1150.00, 'Scalp-cleansing shampoo for the clinic hair-care routine.'),
  product(13, 'Da Hair Growth Serum 100Ml', '10055', 'Hair Serum', '/products/da-hair-growth-serum-100ml.png', 1850.00, 'Scalp serum for the clinic hair-care routine.'),
  product(14, 'New Da Hair Oil 100Ml', '10057', 'Hair Oil', '/products/new-da-hair-oil-100ml.png', 780.00, 'Nourishing hair oil for scalp care and shine.')
];

let isDbConnected = false;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  max: process.env.NODE_ENV === 'production' ? 5 : 10,
  idleTimeoutMillis: 10000
});

let databaseReadyPromise;

const ensureDatabase = () => {
  if (!process.env.DATABASE_URL) {
    return Promise.reject(new Error('DATABASE_URL is not configured.'));
  }

  if (!databaseReadyPromise) {
    const schemaPath = path.join(__dirname, '..', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    databaseReadyPromise = (async () => {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        // Serialize first-time setup across concurrent serverless instances.
        await client.query('SELECT pg_advisory_xact_lock(724913082)');
        await client.query('CREATE TABLE IF NOT EXISTS clinic_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT NOW())');
        const applied = await client.query('SELECT version FROM clinic_schema_migrations WHERE version = $1', ['clinic-v1']);
        if (!applied.rows.length) {
          await client.query(schema);
          await client.query('INSERT INTO clinic_schema_migrations (version) VALUES ($1)', ['clinic-v1']);
        }
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    })().catch((error) => {
      databaseReadyPromise = undefined;
      throw error;
    });
  }

  return databaseReadyPromise;
};

pool.on('connect', () => {
  isDbConnected = true;
});

pool.on('error', (err) => {
  console.warn('PostgreSQL Pool Connection Warning (falling back to mock state if needed):', err.message);
  isDbConnected = false;
});

module.exports = {
  pool,
  getInMemoryProducts: () => inMemoryProducts,
  setInMemoryProducts: (newProducts) => { inMemoryProducts = newProducts; },
  isDbConnected: () => isDbConnected,
  ensureDatabase
};
