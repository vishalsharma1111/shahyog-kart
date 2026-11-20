const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { query } = require('../config/db');

async function backup() {
  console.log('📦 Starting MySQL Database Backup...');
  const tables = await query('SHOW TABLES');
  let sqlDump = `-- Shahyog Kart Pre-Production Database Backup\n-- Generated on: ${new Date().toISOString()}\n\nSET FOREIGN_KEY_CHECKS = 0;\n\n`;

  for (const t of tables) {
    const tableName = Object.values(t)[0];
    const [createRes] = await query(`SHOW CREATE TABLE \`${tableName}\``);
    sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
    sqlDump += createRes['Create Table'] + ';\n\n';

    const rows = await query(`SELECT * FROM \`${tableName}\``);
    if (rows.length > 0) {
      for (const row of rows) {
        const keys = Object.keys(row).map(k => `\`${k}\``).join(', ');
        const vals = Object.values(row).map(v => {
          if (v === null || v === undefined) return 'NULL';
          if (typeof v === 'number') return v;
          if (typeof v === 'boolean') return v ? 1 : 0;
          if (v instanceof Date) return `'${v.toISOString().slice(0, 19).replace('T', ' ')}'`;
          if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "\\'")}'`;
          return `'${String(v).replace(/'/g, "\\'")}'`;
        }).join(', ');
        sqlDump += `INSERT INTO \`${tableName}\` (${keys}) VALUES (${vals});\n`;
      }
      sqlDump += '\n';
    }
  }

  sqlDump += 'SET FOREIGN_KEY_CHECKS = 1;\n';
  const outPath = path.resolve(__dirname, '../config/backup_pre_production.sql');
  fs.writeFileSync(outPath, sqlDump, 'utf8');
  console.log(`✅ Database backup successfully saved to: ${outPath} (${(sqlDump.length / 1024).toFixed(2)} KB)`);
  process.exit(0);
}

backup().catch(err => {
  console.error('❌ Backup failed:', err);
  process.exit(1);
});
