import Stripe from 'stripe';
import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { createCustomer } from '../services/customer.js';
import { createSubscription } from '../services/subscription.js';

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-customer', async (req, res) => {

    try{
        const email = req.body.email;
        const name = req.body.name;

        //error handling for email and name; 

        // if(email || name))
        const CustomerObject = await createCustomer(email, name);
        res.status(201).send(CustomerObject);
    }catch(err){
        res.status(400).send(err)
    }
    
})

router.post('/create-subscription', async (req, res) => {

    const priceId = req.body.priceId;
    const customerId = req.body.customerId;

    try{

        const response = await createSubscription(priceId, customerId);
        res.status(200).send(response);

    }catch(err){
        return res.status(400).send({ error: { message: err.message } });
    }
})


export {stripe, router as payment};

