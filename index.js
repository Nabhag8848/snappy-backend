import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Replicate from 'replicate-js';
import * as dotenv from 'dotenv';
dotenv.config()

import { imagetobase64 } from './image.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

app.get('/', async (req, res) => {
    res.status(200).send('Health Check');
})

app.post('/create', async (req, res) => {
    try {
    
        const inputs = req.body;
        console.log(inputs)
        const replicate = new Replicate({token: process.env.AuthToken});
        console.log(process.env.AuthToken)
        console.log('1');
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        console.log('2')
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);
        console.log(stableDiffusionPrediction[0]);
        const Base64 = await imagetobase64(stableDiffusionPrediction[0]);


        res.status(200).send(Base64);

    }
    catch(err){
        console.log('err')
        res.status(400).send(err);
    }
   
})

app.post('/create-url', async (req, res) => {

    try {
    
        const inputs = req.body;
        const replicate = new Replicate({token: process.env.AuthToken});
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);

        res.status(200).send(stableDiffusionPrediction);

    }
    catch(err){
        console.log('err')
        res.status(400).send(err);
    }
})
    
app.listen(PORT, () => {
    console.log(`Server is up and running on PORT: ${PORT}`);
})