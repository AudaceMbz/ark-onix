const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS whatsapp_teammates (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  role          VARCHAR(255),
  reply_status  VARCHAR(255) DEFAULT 'Typically replies within 1 hour',
  phone_number  VARCHAR(50) NOT NULL,
  welcome_msg   TEXT DEFAULT 'Hi! I''m interested in your properties.',
  image_path    VARCHAR(500),
  display_order INTEGER DEFAULT 0,
  is_active     BOOLEAN DEFAULT TRUE
);
`;

pool.query(sql)
  .then(() => {
    console.log("whatsapp_teammates table created.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
