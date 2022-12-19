import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
dotenv.config();
import longpoll from 'express-longpoll';
import { JwksRateLimitError } from 'jwks-rsa';
import { getUserIdFromToken, VerifySecretFromToken,getUserIdFromSub } from './services/authorization.js';
import { images} from './routers/image.js';
import { profile } from './routers/profile.js';
import { payment } from './payment/payment.js';

const app = express();
const appolling = longpoll(app);
const PORT = process.env.PORT || 5000;

app.use(cors({
    credentials:true,
    origin: "*",
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    preflightContinue: false,
}));

app.options('*', cors());

// middlewares 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: false, parameterLimit: 50000 }));

appolling.create('/auth/:code', ( req, res, next) => {
    req.id =req.params.code;
    next();
});

appolling.publish('/auth/:code', 'ping');

setInterval(function () {
    appolling.publish('/auth/:code', 'ping');
}, 3000);


app.get('/', async (req, res) => {
    res.status(200).send('Health Check');
})

app.use('/images', images);
app.use('/profile', profile);
app.use('/payment', payment);

app.use((req, res, next) => {
    res.status(404).send('404 Not found');   
})

app.use((error, req, res, next) => {
    const status = error.status || 500;
    const message = error.message ||  'Internal Server Error';
    res.status(status).send(message)
})

app.listen(PORT, () => {
    console.log(`Server is up and running on PORT: ${PORT}`);
})

export { appolling };
