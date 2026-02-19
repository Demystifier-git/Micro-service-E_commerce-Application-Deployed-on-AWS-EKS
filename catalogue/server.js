const mongoClient = require('mongodb').MongoClient;
const mongoObjectID = require('mongodb').ObjectID;
const bodyParser = require('body-parser');
const express = require('express');
const pino = require('pino');
const expPino = require('express-pino-logger');

const logger = pino({
    level: 'info',
    prettyPrint: false,
    useLevelLabels: true
});
const expLogger = expPino({
    logger: logger
});

// MongoDB
var db;
var collection;
var mongoConnected = false;

const app = express();

app.use(expLogger);

app.use((req, res, next) => {
    res.set('Timing-Allow-Origin', '*');
    res.set('Access-Control-Allow-Origin', '*');
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/health', (req, res) => {
    var stat = {
        app: 'OK',
        mongo: mongoConnected
    };
    res.json(stat);
});

// all products
app.get('/products', (req, res) => {
    if (mongoConnected) {
        collection.find({}).toArray().then((products) => {
            res.json(products);
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send(e);
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not avaiable');
    }
});

// product by SKU
app.get('/product/:sku', (req, res) => {
    if (mongoConnected) {
        const delay = process.env.GO_SLOW || 0;
        setTimeout(() => {
            collection.findOne({ sku: req.params.sku }).then((product) => {
                req.log.info('product', product);
                if (product) {
                    res.json(product);
                } else {
                    res.status(404).send('SKU not found');
                }
            }).catch((e) => {
                req.log.error('ERROR', e);
                res.status(500).send(e);
            });
        }, delay);
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// products in a category
app.get('/products/:cat', (req, res) => {
    if (mongoConnected) {
        collection.find({ categories: req.params.cat })
            .sort({ name: 1 })
            .toArray()
            .then((products) => {
                if (products) {
                    res.json(products);
                } else {
                    res.status(404).send('No products for ' + req.params.cat);
                }
            }).catch((e) => {
                req.log.error('ERROR', e);
                res.status(500).send(e);
            });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not avaiable');
    }
});

// all categories
app.get('/categories', (req, res) => {
    if (mongoConnected) {
        collection.distinct('categories').then((categories) => {
            res.json(categories);
        }).catch((e) => {
            req.log.error('ERROR', e);
            res.status(500).send(e);
        });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// search name and description
app.get('/search/:text', (req, res) => {
    if (mongoConnected) {
        collection.find({ '$text': { '$search': req.params.text } })
            .toArray()
            .then((hits) => {
                res.json(hits);
            }).catch((e) => {
                req.log.error('ERROR', e);
                res.status(500).send(e);
            });
    } else {
        req.log.error('database not available');
        res.status(500).send('database not available');
    }
});

// set up Mongo
function mongoConnect() {
    return new Promise((resolve, reject) => {
        const mongoUser = process.env.MONGO_USER;
        const mongoPass = process.env.MONGO_PASS;
        const mongoHost = process.env.MONGO_HOST;
        const mongoDB   = process.env.MONGO_DB;
        const mongoPort = process.env.MONGO_PORT || 27017;

        if (!mongoUser || !mongoPass || !mongoHost || !mongoDB) {
            return reject(new Error('MongoDB environment variables not set'));
        }

        const mongoURL = `mongodb://${mongoUser}:${encodeURIComponent(mongoPass)}@${mongoHost}:27017/${mongoDB}?authSource=${process.env.MONGO_AUTH_DB || 'admin'}`;


        mongoClient.connect(mongoURL, { useUnifiedTopology: true }, (error, client) => {
            if (error) {
                reject(error);
            } else {
                db = client.db(mongoDB);
                collection = db.collection('products');
                resolve('connected');
            }
        });
    });
}

// mongodb connection retry loop
function mongoLoop() {
    const mongoUser = process.env.MONGO_USER;
    const mongoHost = process.env.MONGO_HOST;

    if (!mongoUser || !mongoHost) {
        logger.error('MongoDB environment variables not set, cannot connect');
        return;
    }

    logger.info(`Attempting MongoDB connection to ${mongoUser}@${mongoHost}`);

    mongoConnect().then(() => {
        mongoConnected = true;
        logger.info('MongoDB connected');
    }).catch((e) => {
        logger.error('MongoDB connection failed, retrying in 2s', e);
        setTimeout(mongoLoop, 2000);
    });
}

const port = process.env.CATALOGUE_PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    logger.info(`Catalogue service listening on port ${port}`);
    mongoLoop();
});

