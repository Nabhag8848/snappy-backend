import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Replicate from 'replicate-js';
import * as dotenv from 'dotenv';
dotenv.config()
import fetch from 'node-fetch'
// import crypto from 'crypto';

import { imagetobase64 } from './image.js';
// import { base64URLEncodeI, sha256 } from './services/authorization.js';

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 5000;

let code_verifier = "";
let code_challenge = "";

app.get('/', async (req, res) => {
    res.status(200).send('Health Check');
})

app.post('/create', async (req, res) => {
    try {
    
        const inputs = req.body;
        const modifiers = req.body.modifiers;

        if(modifiers != undefined){
            modifiers.forEach(modifier => {
                inputs.prompt = `${inputs.prompt},${modifier}`
            });
        }

        if(req.body.prompt == undefined){
            throw new Error('Prompt is Required!');
        }

        const replicate = new Replicate({token: 'e7ad52e483a88e9adf53be0c240bd66948c63085' });
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);
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
        const replicate = new Replicate({token: 'e7ad52e483a88e9adf53be0c240bd66948c63085' });
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);

        res.status(200).send(stableDiffusionPrediction);

    }
    catch(err){
        console.log('err')
        res.status(400).send(err);
    }
})
 

app.get('/search/:term', async (req, res) => {

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

// app.get('/generate-keys', (req, res) => {
//     try {
        
//         if(code_verifier == ""){
//             code_verifier = base64URLEncodeI(crypto.randomBytes(32));
//             code_challenge = base64URLEncodeI(sha256(code_verifier));
//         }

//         res.status(200).send(JSON.stringify({
//             code_verifier,
//             code_challenge
//         }));

//     }catch(err){ 
//         console.error(err);
//         res.status(400).send(err);
//     }
// })

// app.get('/authorize', async (req, res) => {
//     res.redirect("https://snappy-snappy.us.auth0.com/authorize?response_type=code&code_challenge=" + code_challenge + "&code_challenge_method=S256&client_id=" + process.env.CLIENT_ID + "&redirect_uri=http://localhost:5000/app&scope=SCOPE&state=STATE");
// })

// app.get('/', async (req, res) => {
//     try {
//         res.sendFile(__dirname + '/views/index.html');
//     }
//     catch(err){
//         res.status(400).send(err);
//     }
   
// })

// app.get('/app', async (req, res) => {

//     try {

//         const client_id = process.env.CLIENT_ID ?? "";
//         const code = req.query.code?.toString() ?? "";

//         const url = 'https://snappy-snappy.us.auth0.com/oauth/token'

//         const body = new URLSearchParams({
//                     grant_type: 'authorization_code',
//                     client_id,
//                     code_verifier,
//                     code,
//                     redirect_uri: 'http://localhost:5000/app'
//         })

//         if(req.query.code != undefined){
        
//             const options = {
//                 method: "POST",
//                 headers: {
//                     'Content-Type': 'application/x-www-form-urlencoded'
//                 },
//                 body
//             }
        
//             const response = await fetch(url, options);
//             const data = await response.json();
            
//             res.status(200).send(data);
            

//         }else {
//             console.log('body');

//             if(req.query.error != undefined){
//                 res.status(200).send({
//                     error: req.query.error,
//                     description: req.query.error_description
//                 })
//             }

//             res.send(req.body);
//         }

//     }catch(err){
//         console.log(err);
//         res.send(err);
//     }
         
// })

app.post('/image', async (req, res) => {

    const inputs = req.body;

    const replicate = new Replicate({token: 'e7ad52e483a88e9adf53be0c240bd66948c63085'});
    const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
    const stableDiffusionPrediction = await stableDiffusion.predict(inputs);
    // const Base64 = await imagetobase64(stableDiffusionPrediction);
    console.log(stableDiffusionPrediction)
    res.status(200).send(stableDiffusionPrediction);
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