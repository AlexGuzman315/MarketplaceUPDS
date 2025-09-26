const { Pool } = require("pg");

const pool = new Pool({
  host: 'dpg-d3b9srm3jp1c73aseaug-a.oregon-postgres.render.com',
  user: 'marketplaceupds_user',
  password: 'CvFUrsOlm3mIRUU2R6fs20zyhuFD9Rud',
  database: 'marketplaceupds',
  port: 5432,
  ssl: { rejectUnauthorized: false }
});

module.exports = pool;
