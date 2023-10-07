// Import sqlite3 module
import sqlite3 from 'sqlite3';

// Create or open a database file
const db = new sqlite3.Database('./database.sqlite');

// Export the connection object
export default db;
