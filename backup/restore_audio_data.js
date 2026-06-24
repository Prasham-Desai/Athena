/**
 * restore_audio_data.js
 *
 * Uploads all audio binary files from the local backup back into Cloudflare KV.
 * It uses the backup/audio_manifest.json to map the local files to their original KV keys.
 *
 * Usage: node backup/restore_audio_data.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = __dirname;
const MANIFEST_PATH = path.join(BACKUP_DIR, 'audio_manifest.json');

// NOTE: You must update this with your actual target KV Namespace ID if it has changed!
const KV_NAMESPACE_ID = 'f2274cb066714e51ba6fc9087b1989bc'; 

function uploadKVKey(kvKey, localFilePath) {
  try {
    // wrangler kv key put <key> <value> --path
    const cmd = `npx wrangler kv key put "${kvKey}" --path "${localFilePath}" --namespace-id ${KV_NAMESPACE_ID} --remote`;
    execSync(cmd, { cwd: PROJECT_ROOT, stdio: 'ignore' });
    return true;
  } catch (err) {
    console.error(`    ✗ Failed to upload ${kvKey}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Athena KV Audio — Restore Script           ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  if (!fs.existsSync(MANIFEST_PATH)) {
    console.error(`❌ Manifest not found at ${MANIFEST_PATH}`);
    console.error('Cannot restore audio files without the manifest mapping.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
  console.log(`📋 Found ${manifest.length} audio files in the manifest to restore.\n`);

  let uploaded = 0;
  let failed = 0;

  for (let i = 0; i < manifest.length; i++) {
    const entry = manifest[i];
    const absolutePath = path.resolve(BACKUP_DIR, entry.local_file);
    
    process.stdout.write(`  [${i + 1}/${manifest.length}] Uploading ${entry.kv_key}...`);

    if (!fs.existsSync(absolutePath)) {
      console.log(` ❌ Missing local file: ${entry.local_file}`);
      failed++;
      continue;
    }

    const success = uploadKVKey(entry.kv_key, absolutePath);
    if (success) {
      uploaded++;
      console.log(' ✓ Success');
    } else {
      failed++;
    }
  }

  console.log();
  console.log('═══════════════════════════════════════');
  console.log(`✅ Uploaded: ${uploaded}/${manifest.length} audio files`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
