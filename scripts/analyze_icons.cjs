const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ICONS_DIR = path.join('f:', 'grocery_list', 'public', 'icons');

async function analyzeIcon(iconFile) {
  const { data, info } = await sharp(path.join(ICONS_DIR, iconFile))
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  console.log(`\n=== ${iconFile} ===`);
  console.log(`Size: ${info.width}x${info.height}, channels: ${info.channels}`);
  
  // Sample corners and edges to find background colors
  const channels = info.channels;
  const getPixel = (x, y) => {
    const idx = (y * info.width + x) * channels;
    return { r: data[idx], g: data[idx+1], b: data[idx+2], a: channels === 4 ? data[idx+3] : 255 };
  };
  
  // Check corners
  console.log('Corners:');
  console.log('  TL:', getPixel(0, 0));
  console.log('  TR:', getPixel(info.width-1, 0));
  console.log('  BL:', getPixel(0, info.height-1));
  console.log('  BR:', getPixel(info.width-1, info.height-1));
  
  // Check a few points along the checkerboard pattern area
  console.log('Pattern area samples (near top-left, inside frame):');
  for (let y = 10; y <= 30; y += 5) {
    for (let x = 10; x <= 30; x += 5) {
      const p = getPixel(x, y);
      console.log(`  (${x},${y}): r=${p.r} g=${p.g} b=${p.b} a=${p.a}`);
    }
  }
  
  // Check if there's alpha channel and what values
  if (channels === 4) {
    let transparent = 0, opaque = 0, semi = 0;
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] === 0) transparent++;
      else if (data[i] === 255) opaque++;
      else semi++;
    }
    console.log(`Alpha: ${transparent} transparent, ${opaque} opaque, ${semi} semi-transparent`);
  }
}

async function main() {
  // Analyze a few icons
  await analyzeIcon('64.png');  // The mushroom from screenshot
  await analyzeIcon('1.png');   // Napa cabbage
  await analyzeIcon('20.png');  // Tomato
}

main().catch(console.error);
