const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join('f:', 'grocery_list', 'public', 'icons');

// Step 1: Re-cut icons from original sprites with better cropping
// Step 2: Process each to remove gray/white/dark-border backgrounds

async function processIcon(filename) {
  const filepath = path.join(ICONS_DIR, filename);
  const { data, info } = await sharp(filepath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const { width, height } = info;
  const ch = 4;
  const newData = Buffer.from(data);
  
  // Step 1: Remove ALL low-saturation pixels (gray, white, near-black borders)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * ch;
      const r = newData[idx];
      const g = newData[idx + 1];
      const b = newData[idx + 2];
      const a = newData[idx + 3];
      
      if (a === 0) continue;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const diff = max - min;
      const brightness = (r + g + b) / 3;
      
      // Remove: any pixel with very low color saturation
      // This catches: checkerboard (gray), card frame (dark gray), white bg, thin borders
      // Saturation threshold: diff < 25 means almost no color
      // Exclude very dark saturated pixels (actual black outlines of the icon drawing)
      if (diff < 25 && (brightness > 100 || brightness < 40)) {
        newData[idx + 3] = 0;
      }
      // Also catch near-white pixels  
      if (brightness > 230 && diff < 30) {
        newData[idx + 3] = 0;
      }
    }
  }
  
  // Step 2: Flood-fill from edges to clean up any remaining background
  // Mark connected transparent regions from corners
  const isTransparent = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    return newData[(y * width + x) * ch + 3] === 0;
  };
  
  // Step 3: Remove isolated small opaque clusters at edges
  // (leftover border/frame fragments)
  // Simple approach: if a pixel is within 5px of the edge and 
  // surrounded mostly by transparent pixels, make it transparent
  for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * ch;
        if (newData[idx + 3] === 0) continue;
        
        // Count transparent neighbors in a 3x3 window
        let transparentNeighbors = 0;
        let totalNeighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              totalNeighbors++;
              if (newData[(ny * width + nx) * ch + 3] === 0) {
                transparentNeighbors++;
              }
            }
          }
        }
        
        // If mostly surrounded by transparent, make transparent too
        // (removes thin border lines and isolated fragments)
        if (transparentNeighbors >= 5) {
          newData[idx + 3] = 0;
        }
      }
    }
  }
  
  // Step 4: Save, trim, and center
  const processed = await sharp(newData, { raw: { width, height, channels: ch } })
    .png()
    .toBuffer();
  
  let trimmed;
  try {
    trimmed = await sharp(processed)
      .trim({ threshold: 10 })
      .toBuffer({ resolveWithObject: true });
  } catch (e) {
    // If trim fails (e.g. fully transparent), skip
    return;
  }
  
  const tw = trimmed.info.width;
  const th = trimmed.info.height;
  
  if (tw < 5 || th < 5) return; // Skip if too small after trim
  
  // Resize to fit in 112x112 (with 8px padding = 128x128)
  await sharp(trimmed.data)
    .resize(112, 112, {
      fit: 'inside',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .extend({
      top: 8, bottom: 8, left: 8, right: 8,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .resize(128, 128, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toFile(filepath);
}

async function main() {
  // First, re-cut from original sprites (to get clean cells)
  // But since we already have the icons, let's just re-process them
  
  const files = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith('.png'));
  console.log(`Re-processing ${files.length} icons with aggressive background removal...`);
  
  let done = 0;
  let errors = 0;
  
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
    process.stdout.write(`\r${done}/${files.length}`);
  }
  
  console.log(`\nDone! Processed ${done}, errors: ${errors}`);
}

main().catch(console.error);
