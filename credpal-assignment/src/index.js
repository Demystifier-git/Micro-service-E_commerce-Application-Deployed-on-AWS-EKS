require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// PostgreSQL connection pool
const pool = new Pool({
    host: 'postgres',
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
});

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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});