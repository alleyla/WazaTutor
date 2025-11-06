require('dotenv').config();
const pool = require('./database');
const fs = require('fs');
const path = require('path');

// Make filepath for init.sql file
const sqlFilePath = path.join(__dirname, '..', 'db', 'init.sql');
// Read the SQL file content into a string
const sqlQuery = fs.readFileSync(sqlFilePath, 'utf8');


async function initDatabase() {
  try {
    console.log('Initializing database...');

    // Execute the entire SQL string from the init.sql file
    await pool.query(sqlQuery);

    console.log('Database initialized successfully!');
    console.log('Users table created.');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initDatabase();
