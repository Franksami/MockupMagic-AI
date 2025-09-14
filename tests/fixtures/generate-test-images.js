/**
 * Generate test image fixtures for Playwright tests
 */

const fs = require('fs');
const path = require('path');

// Create fixtures directory if it doesn't exist
const fixturesDir = path.join(__dirname);
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Generate a simple PNG image (1x1 pixel)
function createPNG(filename, sizeInBytes) {
  // PNG header and basic structure
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk (image header)
  const width = 100;
  const height = 100;
  const ihdr = Buffer.concat([
    Buffer.from('IHDR', 'ascii'),
    Buffer.from([0, 0, 0, width]),  // width
    Buffer.from([0, 0, 0, height]), // height
    Buffer.from([8, 2, 0, 0, 0])    // bit depth, color type, etc.
  ]);

  // Create IDAT chunk with dummy data to reach target size
  const targetDataSize = sizeInBytes - pngHeader.length - 100; // Leave room for headers
  const idatData = Buffer.alloc(Math.max(100, targetDataSize), 'A');

  // IEND chunk (end marker)
  const iend = Buffer.from([0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);

  // Combine all chunks
  const png = Buffer.concat([pngHeader, ihdr, idatData, iend]);

  fs.writeFileSync(path.join(fixturesDir, filename), png);
  console.log(`Created ${filename} (${(png.length / 1024).toFixed(2)} KB)`);
}

// Generate a simple JPEG image
function createJPEG(filename, sizeInBytes) {
  // JPEG header (SOI - Start of Image)
  const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);

  // JFIF header
  const jfif = Buffer.from([
    0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00
  ]);

  // Create dummy data to reach target size
  const targetDataSize = sizeInBytes - jpegHeader.length - jfif.length - 2;
  const imageData = Buffer.alloc(Math.max(100, targetDataSize), 'B');

  // JPEG footer (EOI - End of Image)
  const jpegFooter = Buffer.from([0xFF, 0xD9]);

  // Combine all parts
  const jpeg = Buffer.concat([jpegHeader, jfif, imageData, jpegFooter]);

  fs.writeFileSync(path.join(fixturesDir, filename), jpeg);
  console.log(`Created ${filename} (${(jpeg.length / 1024).toFixed(2)} KB)`);
}

// Generate a simple WebP image
function createWebP(filename, sizeInBytes) {
  // WebP header
  const webpHeader = Buffer.from('RIFF', 'ascii');
  const webpType = Buffer.from('WEBP', 'ascii');

  // VP8 chunk (simplified)
  const vp8Header = Buffer.from('VP8 ', 'ascii');

  // Create dummy data to reach target size
  const targetDataSize = sizeInBytes - 20; // Account for headers
  const imageData = Buffer.alloc(Math.max(100, targetDataSize), 'C');

  // File size (little-endian)
  const fileSize = Buffer.alloc(4);
  fileSize.writeUInt32LE(imageData.length + 12, 0);

  // Chunk size
  const chunkSize = Buffer.alloc(4);
  chunkSize.writeUInt32LE(imageData.length, 0);

  // Combine all parts
  const webp = Buffer.concat([
    webpHeader, fileSize, webpType, vp8Header, chunkSize, imageData
  ]);

  fs.writeFileSync(path.join(fixturesDir, filename), webp);
  console.log(`Created ${filename} (${(webp.length / 1024).toFixed(2)} KB)`);
}

// Generate test files
console.log('Generating test image fixtures...\n');

// Small files
createJPEG('test-image-small.jpg', 500 * 1024);      // 500KB
createPNG('test-image-small.png', 500 * 1024);       // 500KB
createWebP('test-image-small.webp', 500 * 1024);     // 500KB

// Medium files
createJPEG('test-image-medium.jpg', 2 * 1024 * 1024); // 2MB
createPNG('test-image-medium.png', 2 * 1024 * 1024);  // 2MB
createWebP('test-image.webp', 2 * 1024 * 1024);       // 2MB

// Large files
createPNG('test-image-large.png', 10 * 1024 * 1024);  // 10MB
createJPEG('test-image-large.jpg', 10 * 1024 * 1024); // 10MB

// Invalid file for testing
fs.writeFileSync(
  path.join(fixturesDir, 'test-invalid.txt'),
  'This is not an image file'
);
console.log('Created test-invalid.txt (text file for validation testing)');

console.log('\n✅ Test fixtures generated successfully!');