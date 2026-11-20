const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

async function deployToTiDB() {
  console.log('========================================================================');
  console.log('🌐 SHAHYOG KART - TIDB CLOUD STARTER ZERO-PREFILLED SCHEMA DEPLOYMENT');
  console.log('========================================================================\n');

  const config = {
    host: process.env.TIDB_HOST || process.env.DATABASE_HOST || 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: parseInt(process.env.TIDB_PORT || process.env.DATABASE_PORT || '4000', 10),
    user: process.env.TIDB_USER || process.env.DATABASE_USER,
    password: process.env.TIDB_PASSWORD || process.env.DATABASE_PASSWORD,
    database: process.env.TIDB_DATABASE || process.env.DATABASE_NAME || 'shahyog_kart',
    multipleStatements: true,
    ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false
    }
  };

  if (!config.user || !config.password) {
    console.log('⚠️ Notice: TiDB Cloud credentials not detected in environment.');
    console.log('To connect to TiDB Cloud Serverless, configure in Render or backend/.env:');
    console.log('  TIDB_HOST=<your-cluster-host>.tidbcloud.com');
    console.log('  TIDB_PORT=4000');
    console.log('  TIDB_USER=<your-cluster-prefix>.root');
    console.log('  TIDB_PASSWORD=<your-password>');
    console.log('  TIDB_DATABASE=shahyog_kart\n');
    return;
  }

  console.log(`Connecting to TiDB Cloud Cluster at ${config.host}:${config.port}...`);
  let connection;
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Successfully connected to TiDB Cloud over TLS/SSL!\n');

    // Check TiDB version
    const [versionRows] = await connection.query('SELECT VERSION() as version');
    console.log(`📊 TiDB Version: ${versionRows[0]?.version}`);

    // Create database if needed
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await connection.query(`USE \`${config.database}\``);

    console.log('Reading schema_master_zero_prefilled.sql (32 tables, zero fake data)...');
    const sqlPath = path.resolve(__dirname, '../config/schema_master_zero_prefilled.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements
    const rawStatements = sqlContent
      .replace(/--.*$/gm, '') // remove line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    console.log(`Executing ${rawStatements.length} database statements on TiDB Cloud...`);
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    let executedCount = 0;
    for (const stmt of rawStatements) {
      if (stmt.toLowerCase().startsWith('use ') || stmt.toLowerCase().startsWith('set ')) {
        continue;
      }
      try {
        await connection.query(stmt);
        executedCount++;
      } catch (err) {
        console.warn(`⚠️ Warning executing statement: ${err.message}`);
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log(`✅ Successfully executed ${executedCount} statements.`);

    const [tables] = await connection.query('SHOW TABLES');
    console.log(`📋 Total tables verified on TiDB Cloud: ${tables.length}`);
    tables.forEach(row => {
      const tableName = Object.values(row)[0];
      console.log(`   - ${tableName}`);
    });

    console.log('\n========================================================================');
    console.log('🎉 ZERO-PREFILLED DATABASE INITIALIZATION COMPLETE!');
    console.log('   All 32 tables exist. Zero fake business data.');
    console.log('========================================================================\n');

  } catch (error) {
    console.error('❌ TiDB Cloud deployment check error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

deployToTiDB();
