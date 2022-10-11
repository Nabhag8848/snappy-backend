import express from 'express';
import cors from 'cors';
import Replicate from 'replicate-js';
import * as dotenv from 'dotenv';
dotenv.config()
import fetch from 'node-fetch'
import cloudinary from 'cloudinary';

// import crypto from 'crypto';

cloudinary.v2.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key ,
    api_secret: process.env.api_secret

})

import { imagetobase64 } from './image.js';
// import { base64URLEncodeI, sha256 } from './services/authorization.js';

const app = express();

app.use(cors());
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true, parameterLimit: 50000}));

const PORT = process.env.PORT || 5000;

let code_verifier = "";
let code_challenge = "";

app.get('/', async (req, res) => {
    res.status(200).send('Health Check');
})

app.post('/create', async (req, res) => {
    try {
    
        await formatData(req);
        const inputs = req.body.data;
        const modifiers = req.body.data.modifiers;

        console.log(inputs);

        if(modifiers != undefined){
            modifiers.forEach(modifier => {
                inputs.prompt = `${inputs.prompt},${modifier}`
            });
        }

        if(req.body.data.prompt == undefined){  
            throw new Error('Prompt is Required!');
        }

        
        const replicate = new Replicate({token: process.env.REPLICATE_TOKEN});
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);
        setTimeout(async () => {

            const Base64 = await imagetobase64(stableDiffusionPrediction[0]);

            res.status(200).send(Base64);
        }, 1000);
            

    }
    catch(err){
        console.log('err: ');
        console.log(err)
        res.status(400).send(err);
    }
   
})

async function uploadImage(imageBase64) {
    const uploadResponse = await cloudinary.v2.uploader.upload(imageBase64, {})
    console.log(uploadResponse); 
    return uploadResponse;
}

app.post('/create-url', async (req, res) => {

    try {
        
        await formatData(req);
        const inputs = req.body.data;

        console.log(inputs);

        const replicate = new Replicate({token: process.env.REPLICATE_TOKEN});
        const stableDiffusion = await replicate.models.get('stability-ai/stable-diffusion');
        const stableDiffusionPrediction = await stableDiffusion.predict(inputs);

        res.status(200).send(stableDiffusionPrediction);

    }
    catch(err){
        console.log('err');
        console.log(err);
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

async function formatData(request){

    const data = request.body.data;
    const width = data.width;
    const height= data.height;
    const prompt_strength =  data.prompt_strength;
    const num_outputs = data.num_outputs;

    const num_inference_steps= data.num_inference_steps;

    const guidance_scale = data.guidance_scale;
    const seed = data.seed;

    const init_image = data.init_image;


    if(width){
        request.body.data.width = parseInt(request.body.data.width);
    }else{
        delete request.body.data.width;
    }

    if(height){
        request.body.data.height = parseInt(request.body.data.height);
    }else{
        delete request.body.data.height;
    }

    if(prompt_strength){
        request.body.data.prompt_strength = parseFloat(request.body.data.prompt_strength)
    }else{
        delete request.body.data.prompt_strength;
    }

    if(num_outputs){
        request.body.data.num_outputs = parseInt(request.body.data.num_outputs);
    }else{
        delete request.body.data.num_outputs;
    }

    if(num_inference_steps){
        request.body.data.num_inference_steps = parseInt(request.body.data.num_inference_steps);
    }else{
        delete request.body.data.num_inference_steps;
    }

    if(guidance_scale){
        request.body.data.guidance_scale = parseFloat(request.body.data.guidance_scale);
    }else{
        delete request.body.data.guidance_scale;
    }

    if(seed){
        request.body.data.seed = parseInt(request.body.data.seed);
    }else{
        delete request.body.data.seed;
    }

    console.log(typeof init_image)

    if(!init_image){
        delete request.body.data.init_image;
    }else {

        const img_res = await uploadImage(init_image);
        const url = img_res.secure_url.replace('.svg', '.png');
        request.body.data.init_image = url;
    }


}

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

    const replicate = new Replicate({token: process.env.REPLICATE_TOKEN});
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