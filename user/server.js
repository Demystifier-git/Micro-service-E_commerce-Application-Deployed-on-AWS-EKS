const { MongoClient, ObjectId } = require('mongodb');
const redis = require('redis');
const express = require('express');
const pino = require('pino');
const expPino = require('express-pino-logger');

const logger = pino({ level: 'info' });
const expLogger = expPino({ logger });

const app = express();
app.use(expLogger);

// CORS headers
app.use((req, res, next) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Access-Control-Allow-Origin', '*');
    next();
});

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Globals ---
let db;
let usersCollection;
let ordersCollection;
let mongoConnected = false;
let redisClient;

// --- Redis setup ---
async function initRedis() {
    redisClient = redis.createClient({
        socket: {
            host: process.env.REDIS_HOST || 'redis',
            port: process.env.REDIS_PORT || 6379
        },
        password: process.env.REDIS_PASSWORD || undefined
    });

    redisClient.on('error', (e) => logger.error('Redis ERROR', e));
    redisClient.on('connect', () => logger.info('Redis connected'));

    await redisClient.connect();
}

// --- MongoDB setup ---
async function initMongo() {
    const mongoUser = process.env.MONGO_USER;
    const mongoPass = process.env.MONGO_PASS;
    const mongoHost = process.env.MONGO_HOST;
    const mongoPort = process.env.MONGO_PORT || 27017;
    const mongoDB   = process.env.MONGO_DB;
    const mongoAuth = process.env.MONGO_AUTH_DB || 'admin';

    if (!mongoUser || !mongoPass || !mongoHost || !mongoDB) {
        throw new Error('MongoDB environment variables not set');
    }

    const mongoURL = `mongodb://${mongoUser}:${encodeURIComponent(mongoPass)}@${mongoHost}:${mongoPort}/${mongoDB}?authSource=${mongoAuth}`;
    const client = new MongoClient(mongoURL, { useUnifiedTopology: true });

    while (!mongoConnected) {
        try {
            await client.connect();
            db = client.db(mongoDB);
            usersCollection = db.collection('users');
            ordersCollection = db.collection('orders');
            mongoConnected = true;
            logger.info('MongoDB connected');
        } catch (err) {
            logger.error('MongoDB connection failed, retrying in 2s', err.message);
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

// --- Health check ---
app.get('/health', (req, res) => {
    res.json({ app: 'OK', mongo: mongoConnected });
});

// --- /uniqueid using Redis ---
app.get('/uniqueid', async (req, res) => {
    try {
        const id = await redisClient.incr('anonymous-counter');
        res.json({ uuid: 'anonymous-' + id });
    } catch (e) {
        req.log.error('Redis error', e);
        res.status(500).send('Redis error');
    }
});

// --- Users list (debugging only) ---
app.get('/users', async (req, res) => {
    if (!mongoConnected) return res.status(500).send('Database not available');
    try {
        const users = await usersCollection.find().toArray();
        res.json(users);
    } catch (e) {
        req.log.error('Mongo error', e);
        res.status(500).send(e.message);
    }
});

// --- Register ---
app.post('/register', async (req, res) => {
    if (!mongoConnected) return res.status(500).send('Database not available');
    const { name, password, email } = req.body;

    if (!name || !password || !email) return res.status(400).send('Insufficient data');

    try {
        const existingUser = await usersCollection.findOne({ name });
        if (existingUser) return res.status(400).send('Name already exists');

        await usersCollection.insertOne({ name, password, email });
        res.send('OK');
    } catch (e) {
        req.log.error('Mongo error', e);
        res.status(500).send(e.message);
    }
});

// --- Login ---
app.post('/login', async (req, res) => {
    if (!mongoConnected) return res.status(500).send('Database not available');
    const { name, password } = req.body;

    if (!name || !password) return res.status(400).send('Name or password not supplied');

    try {
        const user = await usersCollection.findOne({ name });
        if (!user) return res.status(404).send('Name not found');
        if (user.password !== password) return res.status(404).send('Incorrect password');

        res.json(user);
    } catch (e) {
        req.log.error('Mongo error', e);
        res.status(500).send(e.message);
    }
});

// --- Place an order ---
app.post('/order/:id', async (req, res) => {
    if (!mongoConnected) return res.status(500).send('Database not available');

    const username = req.params.id;
    const order = req.body;

    try {
        const user = await usersCollection.findOne({ name: username });
        if (!user) return res.status(404).send('Name not found');

        const historyDoc = await ordersCollection.findOne({ name: username });
        if (historyDoc) {
            const list = historyDoc.history;
            list.push(order);
            await ordersCollection.updateOne({ name: username }, { $set: { history: list } });
        } else {
            await ordersCollection.insertOne({ name: username, history: [order] });
        }

        res.send('OK');
    } catch (e) {
        req.log.error('Mongo error', e);
        res.status(500).send(e.message);
    }
});

// --- Get order history ---
app.get('/history/:id', async (req, res) => {
    if (!mongoConnected) return res.status(500).send('Database not available');

    try {
        const history = await ordersCollection.findOne({ name: req.params.id });
        if (!history) return res.status(404).send('History not found');
        res.json(history);
    } catch (e) {
        req.log.error('Mongo error', e);
        res.status(500).send(e.message);
    }
});

// --- Start server after Redis & Mongo ---
async function startServer() {
    try {
        await initRedis();
        await initMongo();
        const port = process.env.USER_SERVER_PORT || 8080;
        app.listen(port, () => logger.info(`User service listening on port ${port}`));
    } catch (e) {
        logger.error('Failed to start server', e);
        process.exit(1);
    }
}

startServer();

