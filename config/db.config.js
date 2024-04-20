const mysql = require('mysql2/promise');

// Database connection
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Create database and tables if they don't exist
const initializeDatabase = async () => {
    try {
        const connection = await pool.getConnection();

        // Create database
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME}`);
        console.log('Database created or already exists');

        // Use the database
        await connection.query(`USE ${process.env.DB_NAME}`);

        // Create providers table
        await connection.query(`CREATE TABLE IF NOT EXISTS providers (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20) NOT NULL,
            address VARCHAR(255) NOT NULL
        )`);

        console.log('Providers table created');

        // Create services table
        await connection.query(`CREATE TABLE IF NOT EXISTS services (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            provider_id INT,
            FOREIGN KEY (provider_id) REFERENCES providers(id)
        )`);

        console.log('Services table created');

        connection.release();
    } catch (error) {
        console.error('Error creating database and tables:', error);
    }
};

module.exports = {
    pool,
    initializeDatabase
};
