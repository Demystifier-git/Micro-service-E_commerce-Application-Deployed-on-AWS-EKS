const mongoClient = require('mongodb').MongoClient;
const redis = require('redis');
const bodyParser = require('body-parser');
const express = require('express');
const pino = require('pino');
const expPino = require('express-pino-logger');

// --------------------
// Globals
// --------------------
let db;
let usersCollection;
let ordersCollection;
let mongoConnected = false;

// --------------------
// Logger
// --------------------
const logger = pino({
    level: 'info',
    prettyPrint: false,
    useLevelLabels: true
});

const app = express();
app.use(expPino({ logger }));

// --------------------
// Middleware
// --------------------
app.use((req, res, next) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Access-Control-Allow-Origin', '*');
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --------------------
// Health Check
// --------------------
app.get('/health', (req, res) => {
    res.json({
        app: 'OK',
        mongo: mongoConnected
    });
});

// --------------------
// Redis (v3 compatible)
// --------------------
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
    password: process.env.REDIS_PASSWORD
});

redisClient.on('error', (e) => {
    logger.error('Redis ERROR', e);
});

redisClient.on('ready', () => {
    logger.info('Redis connected');
});

// Track anonymous users
app.get('/uniqueid', (req, res) => {
    redisClient.incr('anonymous-counter', (err, r) => {
        if (err) {
            req.log.error(err);
            return res.status(500).send(err);
        }
        res.json({ uuid: 'anonymous-' + r });
    });
});

// --------------------
// MongoDB Connection
// --------------------
function mongoConnect() {
    return new Promise((resolve, reject) => {

        const mongoUser = process.env.MONGO_USER;
        const mongoPass = process.env.MONGO_PASS;
        const mongoHost = process.env.MONGO_HOST;
        const mongoPort = process.env.MONGO_PORT;
        const mongoDB   = process.env.MONGO_DB;

        if (!mongoHost || !mongoPort || !mongoDB) {
            return reject(new Error('Mongo environment variables missing'));
        }

        let mongoURL;

        if (mongoUser && mongoPass) {
            mongoURL =
                `mongodb://${mongoUser}:${encodeURIComponent(mongoPass)}` +
                `@${mongoHost}:${mongoPort}/${mongoDB}?authSource=admin`;
        } else {
            mongoURL =
                `mongodb://${mongoHost}:${mongoPort}/${mongoDB}`;
        }

        mongoClient.connect(
            mongoURL,
            { useNewUrlParser: true, useUnifiedTopology: true },
            (error, client) => {
                if (error) {
                    reject(error);
                } else {
                    db = client.db(mongoDB);
                    usersCollection = db.collection('users');
                    ordersCollection = db.collection('orders');
                    resolve();
                }
            }
        );
    });
}

// Retry loop
function mongoLoop() {
    mongoConnect()
        .then(() => {
            mongoConnected = true;
            logger.info('MongoDB connected');
        })
        .catch((e) => {
            logger.error('Mongo connection ERROR', e.message);
            setTimeout(mongoLoop, 2000);
        });
}

mongoLoop();

// --------------------
// User Routes
// --------------------

// Check user exists
app.get('/check/:id', (req, res) => {
    if (!mongoConnected) {
        return res.status(500).send('database not available');
    }

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

// Get all users
app.get('/users', (req, res) => {
    if (!mongoConnected) {
        return res.status(500).send('database not available');
    }

    usersCollection.find().toArray()
        .then(users => res.json(users))
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// Login
app.post('/login', (req, res) => {

    if (!mongoConnected) {
        return res.status(500).send('database not available');
    }

    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).send('name or password not supplied');
    }

    usersCollection.findOne({ name })
        .then(user => {
            if (!user) return res.status(404).send('name not found');

            if (user.password === password) {
                res.json(user);
            } else {
                res.status(404).send('incorrect password');
            }
        })
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// Register
app.post('/register', (req, res) => {

    if (!mongoConnected) {
        return res.status(500).send('database not available');
    }

    const { name, password, email } = req.body;

    if (!name || !password || !email) {
        return res.status(400).send('insufficient data');
    }

    usersCollection.findOne({ name })
        .then(user => {

            if (user) {
                return res.status(400).send('name already exists');
            }

            return usersCollection.insertOne({
                name,
                password,
                email
            });

        })
        .then(() => res.send('OK'))
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// Create order
app.post('/order/:id', (req, res) => {

    if (!mongoConnected) {
        return res.status(500).send('database not available');
    }

    usersCollection.findOne({ name: req.params.id })
        .then(user => {

            if (!user) {
                return res.status(404).send('name not found');
            }

            return ordersCollection.findOne({ name: req.params.id });

        })
        .then(history => {

            if (!history) {
                return ordersCollection.insertOne({
                    name: req.params.id,
                    history: [req.body]
                });
            }

            history.history.push(req.body);

            return ordersCollection.updateOne(
                { name: req.params.id },
                { $set: { history: history.history } }
            );
        })
        .then(() => res.send('OK'))
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// Get order history
app.get('/history/:id', (req, res) => {

    if (!mongoConnected) {
        return res.status(500).send('database not available');
    }

    ordersCollection.findOne({ name: req.params.id })
        .then(history => {
            if (!history) return res.status(404).send('history not found');
            res.json(history);
        })
        .catch(e => {
            req.log.error(e);
            res.status(500).send(e);
        });
});

// --------------------
// Start Server
// --------------------
const port = process.env.USER_SERVER_PORT;

app.listen(port, () => {
    logger.info(`User service started on port ${port}`);
});
