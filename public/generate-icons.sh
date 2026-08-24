#!/bin/bash

# Generate PWA icons from source image
# This script uses ImageMagick to create different icon sizes

SOURCE_ICON="/Users/merinmathew/Developer/claude/vercel/grids/public/icons/grids_icon.png"
OUTPUT_DIR="/Users/merinmathew/Developer/claude/vercel/grids/public/icons"

# Check if ImageMagick is installed
if ! command -v convert &> /dev/null; then
    echo "ImageMagick is not installed. Please install it:"
    echo "  macOS: brew install imagemagick"
    echo "  Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

# Create different icon sizes
declare -a SIZES=(
    "72x72"
    "96x96"
    "128x128"
    "144x144"
    "152x152"
    "192x192"
    "384x384"
    "512x512"
)

echo "Generating PWA icons..."

for size in "${SIZES[@]}"; do
    echo "Creating ${size} icon..."
    convert "$SOURCE_ICON" -resize ${size}^ -gravity center -extent ${size} \
            "$OUTPUT_DIR/icon-${size}.png"
done

# Create favicon
echo "Creating favicon..."
convert "$SOURCE_ICON" -resize 32x32^ -gravity center -extent 32x32 \
        "$OUTPUT_DIR/favicon.ico"

# Create apple touch icon
echo "Creating Apple touch icon..."
convert "$SOURCE_ICON" -resize 180x180^ -gravity center -extent 180x180 \
        "$OUTPUT_DIR/apple-touch-icon.png"

echo "✓ All icons generated successfully!"
