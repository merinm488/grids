/**
 * Simple icon generator using sharp
 * Run with: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const SOURCE_ICON = path.join(__dirname, 'icons', 'grids_icon.png');
const OUTPUT_DIR = path.join(__dirname, 'icons');

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generateIcons() {
  try {
    // Try using sharp
    const sharp = require('sharp');

    console.log('Generating PWA icons with sharp...');

    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

      await sharp(SOURCE_ICON)
        .resize(size, size, { fit: 'cover', position: 'center' })
        .toFile(outputPath);

      console.log(`✓ Generated ${size}x${size} icon`);
    }

    // Generate favicon
    await sharp(SOURCE_ICON)
      .resize(32, 32, { fit: 'cover', position: 'center' })
      .toFile(path.join(OUTPUT_DIR, 'favicon-32x32.png'));
    console.log('✓ Generated favicon 32x32');

    // Generate apple touch icon
    await sharp(SOURCE_ICON)
      .resize(180, 180, { fit: 'cover', position: 'center' })
      .toFile(path.join(OUTPUT_DIR, 'apple-touch-icon.png'));
    console.log('✓ Generated Apple touch icon');

    console.log('✅ All icons generated successfully!');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.log('⚠️  sharp is not installed. Installing...');
      console.log('Run: npm install sharp --save-dev');
      console.log('Then run: node generate-icons.js');
    } else {
      console.error('Error generating icons:', error);
    }
    process.exit(1);
  }
}

generateIcons();
