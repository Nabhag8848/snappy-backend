import express from 'express';
import {mongoose} from '../db/mongoconnection.js';
import {User, Images} from '../model/user.js';
import { VerifySecretFromToken } from '../services/authorization.js';
import { appolling } from '../index.js';
import { verify_user,verify_jwt } from '../auth/auth.js';


const router = express.Router();

router.post('/token', async ( req, res ) => {

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

router.get('/:id', [verify_jwt,verify_user], async (req ,res) => {
    
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

export {router as profile};

// endpoints: /profile/token, /profile/:id