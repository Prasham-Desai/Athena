// Quick test to check if binary download from KV works correctly
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const key = 'audio:58ab5a22-6679-4a35-a2ea-4ddc4b18578a';
const nsId = '285b7e8ee6534733bbfeb4673d66b4e1';
const outPath = path.join(__dirname, 'audio', 'test_node.webm');

const cmd = `npx wrangler kv key get "${key}" --namespace-id ${nsId} --remote`;
console.log('Running:', cmd);

const buf = execSync(cmd, { maxBuffer: 50 * 1024 * 1024, encoding: 'buffer' });
fs.writeFileSync(outPath, buf);
console.log('Written', buf.length, 'bytes to', outPath);
console.log('Expected from metadata: 319982 bytes');
