const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
INSERT INTO whatsapp_teammates (name, role, reply_status, phone_number, welcome_msg, image_path, display_order) VALUES
  ('Yalda Sheri', 'Senior Property Consultant', 'Typically replies within 1 hour', '+250 790 128 174', 'Hello, I am interested in your services.', null, 1),
  ('Junaid Nuzeebun', 'Property Development Specialist', 'Typically replies within 1 hour', '+250 790 128 174', 'Hi! I would like to learn more about the properties.', null, 2);
`;

pool.query(sql)
  .then(() => {
    console.log("whatsapp_teammates seeded.");
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
