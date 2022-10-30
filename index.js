import express from 'express';
import cors from 'cors';
import Replicate from 'replicate-js';
import * as dotenv from 'dotenv';
dotenv.config();
import fetch from 'node-fetch';
// import compression from 'compression';
import { imagetobase64,getRequiredImageObject } from './image.js';
import { formatData }  from './image.js';
import { verifyJwt, verifyUser, verifyUserAndValidity } from './auth/auth.js';
import longpoll from 'express-longpoll';
// import {connect, redisClient} from './db/connection.js';
import {User, Images} from './model/user.js';
import {mongoose} from './db/mongoconnection.js';
import { JwksRateLimitError } from 'jwks-rsa';
import { getUserIdFromToken, VerifySecretFromToken,getUserIdFromSub } from './services/authorization.js';

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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

app.use(verifyJwt.unless({
    path: ["/token", new RegExp("^/auth"), "/"]
}));
// app.use(compression());
appolling.create('/auth/:code', ( req, res, next) => {
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

        const user = await User.isUserExist(req.body.user, req.body.access_token);

        const code = req.body.code;
        const token = req.body.access_token;

        if(!VerifySecretFromToken(token)){
            return res.status(401).send({
                status:401,
                description: "couldn't verify the payload secret"
            });
        }

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

app.post('/create/:id', verifyUserAndValidity, async (req, res) => {
    try {

        console.log('run');
        const id = req.params.id;

        // const result = await User.findOne({"_id": id}).select('access_allowed');

        // const len = result.user_platform.user_platform_images.length;

        // if(len >= 30 && result.isPro == false){ // need to think if user has expired plan and configure the change
        //     return res.status(429).send({
        //         status:429,
        //         message: "Free tier limit exceeded"
        //     })
        // }

        if(req.body.data.prompt == undefined){  
            return res.status(400).send({
                description: 'Prompt is Required!',
                status: 400,
            });
        }

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

            delete req.body.data.modifiers;
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

        const imgObject = await getRequiredImageObject(inputs, predictionUrl);

        const result = await Images.findOne({"generatedBy": id});
        const updateCount = await User.findById(id);
        updateCount.num_images_generated += 1;
        await updateCount.save();
        const len = result.user_platform[0].user_platform_images.length;
        result.user_platform[0].user_platform_images.push(imgObject);
        result.user_platform[0].number_of_images_generated = len + 1;
        result.num_images_generated += 1;
        await result.save();

        console.log('Result: ', result);

        // const Base64 = await imagetobase64(predictionUrl);
        res.status(200).send(predictionUrl);

    }

    catch(err){
        console.log(err);
        res.status(400).send(err);
    }
   
})

app.post('/create-url/:id', verifyUserAndValidity ,async (req, res) => {

    try {
        const id = req.params.id;

        // const result = await User.findOne({"_id": id});

        // const len = result.user_platform.user_platform_images.length;

        // if(len >= 30 && result.isPro == false){ // need to think if user has expired plan and configure the change
        //     return res.status(429).send({
        //         status:429,
        //         message: "Free tier limit exceeded"
        //     })
        // }

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

        const predictionUrl = stableDiffusionPrediction[0];
        const imgObject = getRequiredImageObject(id, inputs, predictionUrl);
        const image = new Images(imgObject);

        await image.save();

        result.user_platform.user_platform_images.push(image);
        result.user_images.push(image);
        result.user_platform.number_of_images_generated = len + 1;
        await result.save();

        console.log('Result: ', result);
        res.status(200).send(stableDiffusionPrediction);

    }
    catch(err){
        console.log(err);
        res.status(400).send(err);
    }
})
 
app.get('/search/:term',async (req, res) => {

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

app.get('/profile/:id', verifyUser, async (req ,res) => {
    
    try{
        
        const _id = req.params.id; 

        if(!mongoose.isObjectIdOrHexString(_id)){
            return res.status(400).send({
                status:400,
                response: 'Not a valid id'
            });
        }

        const user = await User.findOne({_id});
     
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

app.get('/images/:id', verifyUser, async ( req, res ) => {

    try {

        const id = req.params.id;
        const images = await Images.find({generatedBy: id});

        res.status(200).send(images);
    }catch(err){
        console.error(err);
        res.status(401).send(err);
    }
})

app.post('/image/:id', verifyUser, async (req, res) => {

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
