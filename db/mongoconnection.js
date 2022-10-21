import mongoose from "mongoose";
import * as dotenv from 'dotenv';
dotenv.config();

const mongoUri = process.env.MONGO_URI ?? "";

async function connect(){
    const connection = await mongoose.connect(mongoUri);
}

export {connect};