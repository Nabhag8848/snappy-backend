import express from 'express';
import cors from 'cors';
import Replicate from 'replicate-js';
import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
// import compression from 'compression';
import { imagetobase64 } from './image.js';
import { formatData }  from './image.js';
import { verifyJwt } from './auth/auth.js';
import longpoll from 'express-longpoll';
import {connect, redisClient} from './db/connection.js';

import {User} from './model/user.js';

const app = express();
const appolling = longpoll(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));
// connect(); // redis connection
// app.use(compression());
appolling.create('/auth/:code', ( req, res, next) => {
    console.log(req.params.code)
    req.id =req.params.code;
    next();
});

appolling.publish('/auth/:code', 'ping');

setInterval(function () {
    appolling.publish('/auth/:code', 'ping');
}, 3000);

app.post('/token', async ( req, res ) => {

    try{
        console.log('body: ', req.body);

        const user = await User.isUserExist(req.body.user);

        const code = req.body.code;
        const token = req.body.access_token;

    
        console.log(user);

        if(user){

            appolling.publishToId('/auth/:code', code, {
                code,
                token,
                user
            });

            return res.status(200).send("published");  
        }

      return res.status(500).send("problem storing");

    }catch(err){
        console.log(err);
        res.status(400).send(err);
    }
   
})


app.get('/', async (req, res) => {
    res.status(200).send('Health Check');
})

app.post('/create', async (req, res) => {
    try {

        console.log('run');
        const gotFormat = await formatData(req);

        if(gotFormat != true){
            return res.status(400).send(`{
                err: 'Server couldn't recognise the body you share'
            }`);
        }

        const inputs = req.body.data;
        const modifiers = req.body.data.modifiers;

        if(modifiers != undefined){
            modifiers.forEach(modifier => {
                inputs.prompt = `${inputs.prompt},${modifier}`
            });
        }

        if(req.body.data.prompt == undefined){  
            return res.status(400).send({
                description: 'Prompt is Required!',
                status: 400,
            });
        }
        
        const replicate = new Replicate({ token: process.env.REPLICATE_TOKEN });
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);

        console.log(stableDiffusionPrediction);
        if(stableDiffusionPrediction == undefined){
            
            return res.status(500).send({
                "err" : 'It seems like Token has expired or library has any issue',
            });

        }
        
        if(inputs.num_outputs == 4){

            const response = [];
            for(let i = 0; i < 4; ++i){
                const predictionUrl = stableDiffusionPrediction[i];
                const Base64 = await imagetobase64(predictionUrl);
                response.push(Base64);
            }

            return res.status(200).send(response);

        }

        const predictionUrl = stableDiffusionPrediction[0];
        console.log('predictionUrl: ', predictionUrl);
        const Base64 = await imagetobase64(predictionUrl);
        res.status(200).send(Base64);

    }

    catch(err){
        res.status(400).send(err);
    }
   
})

app.post('/create-url', async (req, res) => {

    try {
        
        const gotFormat = await formatData(req);

        if(gotFormat != true){
            return res.status(400).send(`{
                err: 'Server couldn't recognise the body you share'
            }`);
        }

        const inputs = req.body.data;

        if(req.body.data.prompt == undefined){  
            return res.status(400).send({
                description: 'Prompt is Required!',
                status: 400,
            });
        }

        const replicate = new Replicate({token: process.env.REPLICATE_TOKEN});
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);

        if(stableDiffusionPrediction == undefined){
            
            return res.status(500).send({
                "err" : 'It seems like Token has expired or library has any issue',
            });

        }

        res.status(200).send(stableDiffusionPrediction);

    }
    catch(err){
        console.log('err');
        console.log(err);
        res.status(400).send(err);
    }
})
 
app.get('/search/:term', verifyJwt, async (req, res) => {

    try{

        const term = req.params.term;
        const url = "https://lexica.art/api/v1/search";

        if(term == undefined){
            throw new Error('search text required');
        }

        const response = await fetch(`${url}?q=${term}`);
        const data = await response.json();

        res.status(200).send(data);

    }catch(err){
        console.error(err)
        res.status(400).send(err);
    }
        
})

app.get('/profile/:username', verifyJwt, async (req ,res) => {
    
    try{

        const username = req.params.username;
        const user = await User.findOne({username});

        if(!user){
            return res.send({
                status:200,
                response: 'No user found'
            });
        }

        res.status(200).send(user);

    }catch(err){
        console.error(err);
        res.status(400).send(err);
    }

    
})

app.post('/image', async (req, res) => {

    const inputs = req.body;
    const replicate = new Replicate({token: process.env.REPLICATE_TOKEN});
    const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
    const stableDiffusionPrediction = await stableDiffusion.predict(inputs);
    res.status(200).send(stableDiffusionPrediction);
})



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

/* 
guidance_scale: "12.8"
height: "512"
num_inference_steps: "182"
num_outputs: "4"
prompt: "a new boy"
seed: "new seed"
width: "512
*/