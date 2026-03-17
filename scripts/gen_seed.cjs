// Generate D1 seed SQL from frontend products.js data
// Run: node scripts/gen_seed.cjs
// Output: seed/products_v2.sql

const fs = require('fs');
const path = require('path');

const productsFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'products.js'), 'utf-8');

const regex = /p\((\d+),'([^']+)',I\('[^']+'\),'([^']+)','[^']*',(\d+)\)/g;

let match;
const lines = [
  '-- Auto-generated from products.js',
  '-- Run: npx wrangler d1 execute grocery_db --remote --file=seed/products_v2.sql',
  '',
  'DELETE FROM products WHERE is_system = 1;',
  ''
];

let count = 0;
while ((match = regex.exec(productsFile)) !== null) {
  const [, id, name, category, freqDays] = match;
  const escapedName = name.replace(/'/g, "''");
  lines.push(`INSERT OR REPLACE INTO products (id, name, emoji, category, default_freq_days, is_system) VALUES (${id}, '${escapedName}', '🛒', '${category}', ${freqDays}, 1);`);
  count++;
}

const outPath = path.join(__dirname, '..', 'seed', 'products_v2.sql');
fs.writeFileSync(outPath, lines.join('\n'), 'utf-8');
console.log(`Generated ${count} product INSERT statements -> ${outPath}`);
