// import mongoose from "mongoose";
import * as dotenv from 'dotenv';
dotenv.config();


// async function connect(){
    
//     const connection = await mongoose.connect(process.env.MONGO_URI as string);
// }

import redis from 'redis';

let redisClient;

async function connect() {

    try {

        const port = parseInt(process.env.REDISPORT ?? '');

        redisClient = redis.createClient({
            socket:{
                host: process.env.REDISHOST,
                port
            },
            password: process.env.REDISPASSWORD
        });

        redisClient.on("error", (error) => console.error(`Error : ${error}`));

        await redisClient.connect();

        // const value = await redisClient.set('Test3', 'token');
        // console.log(value);
        
    }catch(err){
        console.error(err);
    
    }

}

connect()

export {connect, redisClient};
  