/**
 * verify_audio.js
 *
 * Verifies downloaded audio files for corruption.
 * A file is considered corrupted if:
 * 1. Its size is 0 bytes.
 * 2. It contains plain text (e.g., a wrangler error message or JSON) instead of binary audio data.
 *
 * Corrupted files will be re-downloaded.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(__dirname, 'audio');
const MANIFEST_PATH = path.join(__dirname, 'audio_manifest.json');
const KV_NAMESPACE_ID = '285b7e8ee6534733bbfeb4673d66b4e1';

// Read manifest
let manifest = [];
if (fs.existsSync(MANIFEST_PATH)) {
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
} else {
  console.error("Manifest not found! Please ensure audio export was run first.");
  process.exit(1);
}

// Function to check if a buffer is mostly plain text (which implies an error message instead of audio binary)
function isPlainText(buffer) {
  // If the file is extremely small, it might be an error string.
  // We'll check the first 100 bytes.
  const sample = buffer.slice(0, Math.min(buffer.length, 100));
  
  let printableCount = 0;
  for (let i = 0; i < sample.length; i++) {
    const byte = sample[i];
    if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
      printableCount++;
    }
  }

  // If more than 90% of the first 100 bytes are printable ASCII, it's very likely a text error message, not a compressed audio blob.
  return (printableCount / sample.length) > 0.9;
}

function downloadKVKey(kvKey, outputPath) {
  try {
    const buffer = execSync(
      `npx wrangler kv key get "${kvKey}" --namespace-id ${KV_NAMESPACE_ID} --remote`,
      { cwd: PROJECT_ROOT, maxBuffer: 50 * 1024 * 1024, encoding: 'buffer' }
    );
    fs.writeFileSync(outputPath, buffer);
    return buffer.length;
  } catch (err) {
    console.error(`    ✗ Failed to download ${kvKey}: ${err.message}`);
    return -1;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Athena KV Audio — Verification Script      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  const filesToRedownload = [];

  console.log('🔍 Scanning for corrupted files...\n');

  for (const entry of manifest) {
    const filePath = path.join(PROJECT_ROOT, 'backup', entry.local_file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Missing: ${entry.local_file}`);
      filesToRedownload.push(entry);
      continue;
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.log(`⚠️ Empty (0 bytes): ${entry.local_file}`);
      filesToRedownload.push(entry);
      continue;
    }

    // Check for plain text
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(100);
    const bytesRead = fs.readSync(fd, buffer, 0, 100, 0);
    fs.closeSync(fd);

    const actualBuffer = buffer.slice(0, bytesRead);
    if (isPlainText(actualBuffer)) {
      const textContent = actualBuffer.toString('utf8').replace(/\n/g, ' ').substring(0, 50);
      console.log(`⚠️ Corrupted (Text Content): ${entry.local_file} -> "${textContent}..."`);
      filesToRedownload.push(entry);
    }
  }

  console.log(`\n📋 Found ${filesToRedownload.length} corrupted or missing files.\n`);

  if (filesToRedownload.length === 0) {
    console.log('✅ All audio files are completely healthy!');
    return;
  }

  console.log('🔄 Re-downloading corrupted files...\n');
  let fixedCount = 0;

  for (let i = 0; i < filesToRedownload.length; i++) {
    const entry = filesToRedownload[i];
    const absolutePath = path.join(PROJECT_ROOT, 'backup', entry.local_file);

    process.stdout.write(`  [${i + 1}/${filesToRedownload.length}] Re-downloading ${entry.kv_key}...`);

    const size = downloadKVKey(entry.kv_key, absolutePath);
    
    if (size >= 0) {
      // Re-verify the new file
      const newBuffer = fs.readFileSync(absolutePath);
      if (size === 0 || isPlainText(newBuffer)) {
        console.log(` ❌ Still corrupted (Size: ${size}). Source KV might be empty/invalid.`);
      } else {
        console.log(` ✓ Fixed (${(size / 1024).toFixed(1)} KB)`);
        fixedCount++;
        entry.size_bytes = size; // Update manifest entry with new size
      }
    }
  }

  // Save updated manifest
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  console.log(`\n✅ Verification complete. Fixed ${fixedCount}/${filesToRedownload.length} files.`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
