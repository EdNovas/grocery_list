const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join('f:', 'grocery_list', 'public', 'icons');

// Process a single icon: remove background, trim frame, center content
async function processIcon(filename) {
  const filepath = path.join(ICONS_DIR, filename);
  const { data, info } = await sharp(filepath)
    .ensureAlpha() // Ensure 4 channels (RGBA)
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const { width, height } = info;
  const channels = 4; // ensureAlpha guarantees 4
  
  // Step 1: Make gray/white background pixels transparent
  // The background consists of alternating gray (#B0B0B0-#FFFFFF) checkerboard
  // and card frame borders (gray ~140-200)
  // Content pixels are typically more saturated/colorful
  const newData = Buffer.from(data);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = newData[idx];
      const g = newData[idx + 1];
      const b = newData[idx + 2];
      const a = newData[idx + 3];
      
      if (a === 0) continue; // Already transparent
      
      // Calculate saturation - background pixels are low saturation (gray)
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      const brightness = (r + g + b) / 3;
      
      // Background detection:
      // 1. Very low saturation (gray to white) - checkerboard pattern
      // 2. Medium gray (card frame borders)
      const isGrayBackground = diff < 20 && brightness > 130;
      // Near white
      const isWhite = diff < 15 && brightness > 220;
      // Near black line (frame outline) that's thin
      const isDarkFrame = diff < 10 && brightness < 30;
      
      if (isGrayBackground || isWhite) {
        newData[idx + 3] = 0; // Make transparent
      }
    }
  }
  
  // Step 2: Use sharp to trim and re-center
  const processed = await sharp(newData, { raw: { width, height, channels } })
    .png()
    .toBuffer();
  
  // Trim whitespace, then pad to center in 128x128
  const trimmed = await sharp(processed)
    .trim({ threshold: 10 })
    .toBuffer({ resolveWithObject: true });
  
  const tw = trimmed.info.width;
  const th = trimmed.info.height;
  
  // Calculate padding to center in 120x120 (with some margin)
  const targetSize = 120;
  
  // Scale down if needed, then center in 128x128
  let finalBuffer;
  if (tw > targetSize || th > targetSize) {
    finalBuffer = await sharp(trimmed.data)
      .resize(targetSize, targetSize, { 
        fit: 'inside', 
        background: { r: 0, g: 0, b: 0, alpha: 0 } 
      })
      .extend({
        top: 4, bottom: 4, left: 4, right: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(128, 128, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(filepath);
  } else {
    // Center in 128x128
    finalBuffer = await sharp(trimmed.data)
      .extend({
        top: Math.max(0, Math.floor((128 - th) / 2)),
        bottom: Math.max(0, Math.ceil((128 - th) / 2)),
        left: Math.max(0, Math.floor((128 - tw) / 2)),
        right: Math.max(0, Math.ceil((128 - tw) / 2)),
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .resize(128, 128, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toFile(filepath);
  }
}

async function main() {
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'));
  console.log(`Processing ${files.length} icons...`);
  
  let done = 0;
  let errors = 0;
  
  // Process in batches of 10
  for (let i = 0; i < files.length; i += 10) {
    const batch = files.slice(i, i + 10);
    await Promise.all(batch.map(async (f) => {
      try {
        await processIcon(f);
        done++;
      } catch (e) {
        console.log(`ERROR: ${f}: ${e.message}`);
        errors++;
      }
    }));
    process.stdout.write(`\r${done}/${files.length} done`);
  }
  
  console.log(`\n\nDone! Processed ${done}, errors: ${errors}`);
}

main().catch(console.error);
