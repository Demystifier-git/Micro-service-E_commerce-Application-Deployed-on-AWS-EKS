require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
    host: 'postgres', // Docker service name
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
});

// Function to initialize DB
async function initDB() {
    try {
        // Create table if not exists
        await pool.query(`
            CREATE TABLE IF NOT EXISTS process_data (
                id SERIAL PRIMARY KEY,
                data JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table process_data is ready');

        // Optional: insert default record if table is empty
        const { rows } = await pool.query('SELECT COUNT(*) FROM process_data');
        if (parseInt(rows[0].count) === 0) {
            await pool.query(
                'INSERT INTO process_data (data) VALUES ($1)',
                [{ message: 'Initial data record' }]
            );
            console.log('Inserted initial record into process_data');
        }
    } catch (err) {
        console.error('Error initializing database', err);
        process.exit(1); // stop app if DB fails
    }
}

// Health endpoint
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            database: 'disconnected'
        });
    }
});

// Status endpoint
app.get('/status', (req, res) => {
    res.json({
        app: 'credpal-node-app',
        status: 'running',
        environment: process.env.NODE_ENV || 'production'
    });
});

// Process endpoint
app.post('/process', async (req, res) => {
    const data = req.body;

    try {
        const result = await pool.query(
            'INSERT INTO process_data (data) VALUES ($1) RETURNING *',
            [data]
        );

        res.json({
            message: 'Data processed successfully',
            record: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to process data'
        });
    }
});

// GET all records (optional, useful for testing)
app.get('/process', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM process_data ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch data' });
    }
});

// Start server after DB initialization
initDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});