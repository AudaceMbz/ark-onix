const mysql = require('mysql2/promise');

async function renameDB() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
  });

  try {
    console.log('Creating database onix_db...');
    await connection.query('CREATE DATABASE IF NOT EXISTS onix_db');
    
    const [tables] = await connection.query('SHOW TABLES FROM onyx_db');
    for (let tableRow of tables) {
      const tableName = Object.values(tableRow)[0];
      console.log(`Copying table ${tableName}...`);
      await connection.query(`CREATE TABLE onix_db.${tableName} LIKE onyx_db.${tableName}`);
      await connection.query(`INSERT INTO onix_db.${tableName} SELECT * FROM onyx_db.${tableName}`);
    }
    
    console.log('Database cloned successfully.');
  } catch (err) {
    console.error('Error during DB rename:', err);
  } finally {
    await connection.end();
  }
}

renameDB();
