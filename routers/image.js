import express from 'express';
import {format, requiredImageobj} from '../services/format.js';
import {User, Images} from '../model/user.js';
import {mongoose} from '../db/mongoconnection.js';
import { is_validity_left, verify_user, verify_jwt } from '../auth/auth.js';
import fetch from 'node-fetch';


const router = express.Router();

router.post('/create/:id',[verify_jwt, verify_user, is_validity_left], async (req ,res) => {

    try{

            const id = req.params.id;
            console.log(req.body)
            if(req.body.data.prompt == undefined){  
                return res.status(400).send({
                    description: 'Prompt is Required!',
                    status: 400,
                });
            }
        
            const formatted_body = await format(req);
        
            if(formatted_body.key === undefined){
                return res.status(400).send(`{
                    err: 'Server couldn't recognise the body you share'
                }`);
            }
        
            const inputs = formatted_body;
            const modifiers = req.body.data.modifiers;
            
            if(modifiers != undefined){
                modifiers.forEach(modifier => {
                    inputs.prompt = `${inputs.prompt},${modifier.value}`
                });
            }

            console.log('input: ', inputs);
            
            const response = await fetch(`${process.env.STABLEDIFFUSIONAPI}/text2img`, {
                method:"POST",
                headers: { 
                    'Content-Type': 'application/json', 
                    'Cookie': `XSRF-TOKEN=${process.env.XSRF_TOKEN}; sdapi_session=${process.env.SDAPI_SESSION}`
                },
                body: JSON.stringify(formatted_body),  
            })
             
            const data = JSON.parse(await response.text());
            console.log(data);

            if(data.status == 'error'){ 

                return res.status(401).send({
                    "err" : data.message
                });
            
            }
        
            const predictionUrl = data.output;
            const imgObject = await requiredImageobj(inputs);
            
            const updateCount = await User.findById(id);
            updateCount.num_images_generated += parseInt(inputs.samples);
            await updateCount.save();

            const result = await Images.findOne({"generatedBy": id});

            const len = result.user_platform[0].user_platform_images.length;
            result.user_platform[0].number_of_images_generated = len + parseInt(inputs.samples);

            for(let count = 0; count < predictionUrl.length; ++count){
                imgObject.image_url = predictionUrl[count];
                result.user_platform[0].user_platform_images.push(imgObject);
            }

            result.num_images_generated += parseInt(inputs.samples);
            await result.save();

            res.status(200).send(predictionUrl);

    }catch(err) {
        console.log(err);
        res.status(400).send(err);
    }
})    

router.post('/webhook', (req, res) => {
    try {

        console.log('webhook Called: ', req);
        res.send(req.body);

    }catch(err){

        console.error(err);
    }
})

router.get('/webhook', (req, res) => {
   try{
    console.log('websocket pinged');
    res.send(req);
   }catch(err){
    res.send(err);
   }
})

router.get('/:id', [verify_jwt, verify_user], async ( req, res ) => {

    try {

        const id = req.params.id;

        if(!mongoose.isObjectIdOrHexString(id)){
            return res.status(400).send({
                status:400,
                response: 'Not a valid id'
            });
        }

        const images = await Images.find({generatedBy: id});

        res.status(200).send(images);
    }catch(err){
        console.error(err);
        res.status(401).send(err);
    }
})


router.get('/search/:term',[verify_jwt, verify_user], async (req, res) => {

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

export {router as images};

// endpoints: /images/search/:id, /images/:id, /images/create/:id

// {
//   status: 'success',
//   generationTime: 4.167768478393555,
//   id: 86532,
//   output: [
//     ''
//   ]
// }
