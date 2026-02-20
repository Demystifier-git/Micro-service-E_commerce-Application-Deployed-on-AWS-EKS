const mongoClient = require('mongodb').MongoClient;
const redis = require('redis');
const bodyParser = require('body-parser');
const express = require('express');
const pino = require('pino');
const expPino = require('express-pino-logger');

// --------------------
// MongoDB variables
// --------------------
let db;
let usersCollection;
let ordersCollection;
let mongoConnected = false;

// --------------------
// Logger setup
// --------------------
const logger = pino({
    level: 'info',
    prettyPrint: false,
    useLevelLabels: true
});

const expLogger = expPino({ logger });

const app = express();
app.use(expLogger);

// --------------------
// CORS headers
// --------------------
app.use((req, res, next) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Access-Control-Allow-Origin', '*');
    next();
});

// --------------------
// Body parser
// --------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --------------------
// Health endpoint
// --------------------
app.get('/health', (req, res) => {
    res.json({
        app: 'OK',
        mongo: mongoConnected
    });
});

// --------------------
// Unique ID (Redis counter)
// --------------------
app.get('/uniqueid', (req, res) => {
    redisClient.incr('anonymous-counter', (err, r) => {
        if (!err) {
            res.json({ uuid: 'anonymous-' + r });
        } else {
            req.log.error('Redis ERROR', err);
            res.status(500).send(err);
        }
    });
});

// --------------------
// Check user exists
// --------------------
app.get('/check/:id', (req, res) => {
    if (!mongoConnected)
        return res.status(500).send('database not available');

    usersCollection.findOne({ name: req.params.id })
        .then(user => {
            if (user) res.send('OK');
            else res.status(404).send('user not found');
        })
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// --------------------
// List all users (debug)
// --------------------
app.get('/users', (req, res) => {
    if (!mongoConnected)
        return res.status(500).send('database not available');

    usersCollection.find().toArray()
        .then(users => res.json(users))
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// --------------------
// Login
// --------------------
app.post('/login', (req, res) => {
    const { name, password } = req.body;

    if (!name || !password)
        return res.status(400).send('name or password not supplied');

    if (!mongoConnected)
        return res.status(500).send('database not available');

    usersCollection.findOne({ name })
        .then(user => {
            if (!user) return res.status(404).send('name not found');
            if (user.password === password) res.json(user);
            else res.status(404).send('incorrect password');
        })
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// --------------------
// Register
// --------------------
app.post('/register', (req, res) => {
    const { name, password, email } = req.body;

    if (!name || !password || !email)
        return res.status(400).send('insufficient data');

    if (!mongoConnected)
        return res.status(500).send('database not available');

    usersCollection.findOne({ name })
        .then(user => {
            if (user)
                return res.status(400).send('name already exists');

            return usersCollection.insertOne({ name, password, email });
        })
        .then(() => res.send('OK'))
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// --------------------
// Create order
// --------------------
app.post('/order/:id', (req, res) => {
    if (!mongoConnected)
        return res.status(500).send('database not available');

    usersCollection.findOne({ name: req.params.id })
        .then(user => {
            if (!user)
                return res.status(404).send('name not found');

            return ordersCollection.findOne({ name: req.params.id });
        })
        .then(history => {
            if (!history) {
                return ordersCollection.insertOne({
                    name: req.params.id,
                    history: [req.body]
                });
            }

            return ordersCollection.updateOne(
                { name: req.params.id },
                { $push: { history: req.body } }
            );
        })
        .then(() => res.send('OK'))
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// --------------------
// Get order history
// --------------------
app.get('/history/:id', (req, res) => {
    if (!mongoConnected)
        return res.status(500).send('database not available');

    ordersCollection.findOne({ name: req.params.id })
        .then(history => {
            if (history) res.json(history);
            else res.status(404).send('history not found');
        })
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// --------------------
// Redis connection (v3)
// --------------------
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

redisClient.on('error', e => logger.error('Redis ERROR', e));
redisClient.on('ready', () => logger.info('Redis connected'));
// Note: .connect() removed for Redis v3

// --------------------
// MongoDB connection
// --------------------
function mongoConnect() {
    return new Promise((resolve, reject) => {

        let mongoURL = '';

        if (process.env.MONGO_USER && process.env.MONGO_PASS) {
            mongoURL =
                `mongodb://${process.env.MONGO_USER}:${process.env.MONGO_PASS}` +
                `@${process.env.MONGO_HOST}:${process.env.MONGO_PORT}` +
                `/${process.env.MONGO_DB}?authSource=admin`;
        } else {
            mongoURL =
                `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}` +
                `/${process.env.MONGO_DB}`;
        }

        mongoClient.connect(
            mongoURL,
            { useNewUrlParser: true, useUnifiedTopology: true }
        )
        .then(client => {
            db = client.db(process.env.MONGO_DB);
            usersCollection = db.collection('users');
            ordersCollection = db.collection('orders');
            resolve();
        })
        .catch(err => reject(err));
    });
}

// Retry loop
function mongoLoop() {
    mongoConnect()
        .then(() => {
            mongoConnected = true;
            logger.info('MongoDB connected');
        })
        .catch(e => {
            logger.error('Mongo connection ERROR', e);
            setTimeout(mongoLoop, 2000);
        });
}

mongoLoop();

// --------------------
// Start server
// --------------------
const port = process.env.USER_SERVER_PORT || '8080';

app.listen(port, () => {
    logger.info(`User service started on port ${port}`);
});