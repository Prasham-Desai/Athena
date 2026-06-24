/**
 * fetch_audio_data.js
 *
 * Downloads all audio binary files from Cloudflare KV and saves them locally.
 * Each audio file is saved as backup/audio/<kv_key_id>.webm
 * Also creates a manifest JSON mapping kv_key → local file path + metadata.
 *
 * Usage:  node backup/fetch_audio_data.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const AUDIO_DIR = path.join(__dirname, 'audio');
const KV_NAMESPACE_ID = '285b7e8ee6534733bbfeb4673d66b4e1';

// Ensure output directory exists
fs.mkdirSync(AUDIO_DIR, { recursive: true });

function listKVKeys() {
  console.log('📋 Listing all KV keys...');
  const stdout = execSync(
    `npx wrangler kv key list --namespace-id ${KV_NAMESPACE_ID} --remote`,
    { cwd: PROJECT_ROOT, maxBuffer: 10 * 1024 * 1024 }
  ).toString();

  const jsonStart = stdout.indexOf('[');
  const keys = JSON.parse(stdout.substring(jsonStart));
  return keys.map(k => k.name);
}

function downloadKVKey(kvKey, outputPath) {
  // wrangler kv key get outputs raw binary to stdout
  // We use --binary flag and redirect to file
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
  console.log('║   Athena KV Audio — Full Export Script       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  // Load audio_notes metadata to map kv_key → topic info
  let audioNotesMetadata = [];
  const metadataPath = path.join(__dirname, 'json', 'audio_notes.json');
  if (fs.existsSync(metadataPath)) {
    audioNotesMetadata = JSON.parse(fs.readFileSync(metadataPath, 'utf-8'));
    console.log(`📂 Loaded ${audioNotesMetadata.length} audio_notes metadata entries`);
  }

  // Build kv_key → metadata lookup
  const metadataByKey = {};
  for (const note of audioNotesMetadata) {
    metadataByKey[note.kv_key] = note;
  }

  // List all KV keys
  const allKeys = listKVKeys();
  const audioKeys = allKeys.filter(k => k.startsWith('audio:'));
  console.log(`🔑 Found ${audioKeys.length} audio keys in KV\n`);

  const manifest = [];
  let downloaded = 0;
  let failed = 0;
  let totalBytes = 0;

  for (let i = 0; i < audioKeys.length; i++) {
    const kvKey = audioKeys[i];
    const audioId = kvKey.replace('audio:', '');

    // Determine extension from metadata
    const meta = metadataByKey[kvKey];
    let ext = '.webm'; // default
    if (meta && meta.mime_type) {
      if (meta.mime_type.includes('ogg')) ext = '.ogg';
      else if (meta.mime_type.includes('mp3') || meta.mime_type.includes('mpeg')) ext = '.mp3';
      else if (meta.mime_type.includes('wav')) ext = '.wav';
      else if (meta.mime_type.includes('mp4')) ext = '.mp4';
    }

    const filename = `${audioId}${ext}`;
    const outputPath = path.join(AUDIO_DIR, filename);

    process.stdout.write(`  [${i + 1}/${audioKeys.length}] Downloading ${audioId}...`);

    let size = -1;
    if (fs.existsSync(outputPath)) {
      size = fs.statSync(outputPath).size;
      console.log(` ⏭️ Skipped (already exists: ${(size / 1024).toFixed(1)} KB)`);
    } else {
      size = downloadKVKey(kvKey, outputPath);
      if (size >= 0) {
        console.log(` ✓ ${(size / 1024).toFixed(1)} KB`);
      }
    }

    if (size >= 0) {
      downloaded++;
      totalBytes += size;

      manifest.push({
        kv_key: kvKey,
        local_file: `audio/${filename}`,
        size_bytes: size,
        mime_type: meta ? meta.mime_type : 'unknown',
        topic_id: meta ? meta.topic_id : null,
        duration_seconds: meta ? meta.duration_seconds : null,
      });
    } else {
      failed++;
    }
  }

  // Save manifest
  const manifestPath = path.join(__dirname, 'audio_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log();
  console.log('═══════════════════════════════════════');
  console.log(`✅ Downloaded: ${downloaded}/${audioKeys.length} audio files`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log(`💾 Total size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`📄 Manifest: backup/audio_manifest.json`);
  console.log(`📁 Audio dir: backup/audio/`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
