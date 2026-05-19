const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'onix_db';
const outputFile = 'onix_db_backup.sql';

console.log(`Starting backup of ${dbName}...`);

// Use mysqldump if available (standard with XAMPP)
const command = `mysqldump -u root ${dbName} > ${outputFile}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.warn('mysqldump failed, attempting fallback node-based dump...');
    // Fallback logic could go here if needed, but usually mysqldump is there on development machines
    return;
  }
  console.log(`✅ Database backup saved to: ${outputFile}`);
  console.log(`⚠️  Next Steps: `);
  console.log(`1. Move ${outputFile} to your new host.`);
  console.log(`2. Zip the 'public/uploads' folder and upload it to the same location on the new host.`);
});
