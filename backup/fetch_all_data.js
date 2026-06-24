/**
 * fetch_all_data.js
 * 
 * Fetches all data from the remote Cloudflare D1 database (athena-db)
 * using `wrangler d1 execute` and saves:
 *   1. Individual JSON files per table in backup/json/
 *   2. A comprehensive SQL dump file at backup/athena_full_backup.sql
 *
 * Usage:  node backup/fetch_all_data.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.resolve(__dirname);
const JSON_DIR = path.join(BACKUP_DIR, 'json');

// All user tables (excluding internal _cf_KV, d1_migrations, sqlite_sequence)
const TABLES = [
  'subjects',
  'chapters',
  'topics',
  'subtopics',
  'tasks',
  'daily_progress',
  'activities',
  'user_settings',
  'study_sessions',
  'study_blocks',
  'exams',
  'stories',
  'story_audios',
  'audio_notes',
];

// Ensure output directories exist
fs.mkdirSync(JSON_DIR, { recursive: true });

function fetchTable(table) {
  console.log(`  Fetching ${table}...`);
  const cmd = `npx wrangler d1 execute athena-db --remote --command "SELECT * FROM ${table};" --json`;
  const stdout = execSync(cmd, { cwd: PROJECT_ROOT, maxBuffer: 50 * 1024 * 1024 }).toString();

  // The JSON output starts with '[' — wrangler prints some prefix lines first
  const jsonStart = stdout.indexOf('[');
  const jsonStr = stdout.substring(jsonStart);
  const parsed = JSON.parse(jsonStr);
  return parsed[0].results;
}

function escapeSQL(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  // Escape single quotes
  const escaped = String(val).replace(/'/g, "''");
  return `'${escaped}'`;
}

function generateInsertStatements(table, rows) {
  if (!rows || rows.length === 0) return `-- ${table}: no data\n`;

  const columns = Object.keys(rows[0]);
  const lines = [];
  lines.push(`-- Table: ${table} (${rows.length} rows)`);

  for (const row of rows) {
    const values = columns.map(col => escapeSQL(row[col]));
    lines.push(`INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
  }

  lines.push('');
  return lines.join('\n');
}

// ──── Main ────

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   Athena D1 Database — Full Backup Script   ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log();

  const allData = {};
  const sqlParts = [];

  sqlParts.push('-- ============================================');
  sqlParts.push('-- Athena D1 Database — Full Backup');
  sqlParts.push(`-- Generated: ${new Date().toISOString()}`);
  sqlParts.push('-- ============================================');
  sqlParts.push('');
  sqlParts.push('PRAGMA foreign_keys = OFF;');
  sqlParts.push('');

  for (const table of TABLES) {
    try {
      const rows = fetchTable(table);
      allData[table] = rows;

      // Save individual JSON
      const jsonPath = path.join(JSON_DIR, `${table}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
      console.log(`    ✓ ${table}: ${rows.length} rows → ${path.relative(PROJECT_ROOT, jsonPath)}`);

      // Generate SQL
      sqlParts.push(generateInsertStatements(table, rows));
    } catch (err) {
      console.error(`    ✗ ${table}: FAILED — ${err.message}`);
      sqlParts.push(`-- ${table}: FETCH FAILED\n`);
    }
  }

  sqlParts.push('PRAGMA foreign_keys = ON;');
  sqlParts.push('');

  // Write combined SQL dump
  const sqlPath = path.join(BACKUP_DIR, 'athena_full_backup.sql');
  fs.writeFileSync(sqlPath, sqlParts.join('\n'));
  console.log();
  console.log(`✅ SQL dump saved to: ${path.relative(PROJECT_ROOT, sqlPath)}`);

  // Write combined JSON
  const combinedJsonPath = path.join(BACKUP_DIR, 'athena_full_backup.json');
  fs.writeFileSync(combinedJsonPath, JSON.stringify(allData, null, 2));
  console.log(`✅ JSON dump saved to: ${path.relative(PROJECT_ROOT, combinedJsonPath)}`);

  // Summary
  console.log();
  console.log('📊 Summary:');
  let totalRows = 0;
  for (const [table, rows] of Object.entries(allData)) {
    console.log(`   ${table}: ${rows.length} rows`);
    totalRows += rows.length;
  }
  console.log(`   ─────────────────────`);
  console.log(`   Total: ${totalRows} rows across ${TABLES.length} tables`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
