import mongoose,{ Schema } from "mongoose";
import {connect} from '../db/mongoconnection.js';
import validator from 'validator';
import {getUserIdFromToken} from '../services/authorization.js';
import fetch from 'node-fetch';
import * as dotenv from "dotenv";
dotenv.config();

connect();

const userSchema = new Schema({
    user_id: {
        type:String,
        unique:true,
        required:true,
        trim:true,
    },
    username: {
        type:String,
        unique:true,
        required:true,
        trim:true
    },
    name: {
        type: String,
        required: false,
    },
    email:{
        type: String,
        unique:true,
        required:true,
        lowercase:true,
        trim:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email")
            }
        }
    },
    picture:{ type: String },
    isPro: { type: Boolean, default: false }, 
    access_allowed: { type: Boolean, default: true },
    num_images_generated: {
        type: Number,
        default: 0
    },

    // user ka account ka credentials b store krna ka usna login with kia use kia ha login with figma ya google ya twitter schema ma 
},{
    timestamps: true,
})

const imagesSchema = new Schema({
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    num_images_generated: {
        type: Number,
        default: 0
    },
    user_platform: [{
        name: {
            type: String, 
            enum: ['FIGMA', 'SKETCH', 'CANVA'],
            require: true,
            default: 'FIGMA'
        },
        number_of_images_generated: {
            type: Number,
            default: 0
        },
        user_platform_images:  [{
            image_url: { 
                type: String, 
                require: true 
            },
            createdAt: {
                type: Date,
                default: new Date(0)
            },
            type: {
                type: String, 
                enum: ['IMAGE_TO_IMAGE', 'TEXT_TO_IMAGE'], 
                require: true,
                default:'TEXT_TO_IMAGE'
            },
            prompt: {
                type: String, 
                require: true
            },
            negative_prompt: {
                type: String
            },
            seed: {
                type: Number
            },
            customizations: {
                guidance_scale: Number,
                height: Number,
                num_inference_steps: Number,
                width: Number,
                prompt_strength: Number
            },
            requested_from: { 
                type: String 
            },
            favourite: {
                type: Boolean 
            }
        }]
    }], 
    
    
})

userSchema.statics.isUserExist = async function({
    email,
    name,
    nickname,
    picture,
}, access_token) {
    
    try{
        console.log(email)
        const user = await User.findOne({email});
        console.log('finding user', user);

        if(!user){

            const customer = await fetch(`${process.env.WEBHOOK}/payment/create-customer`,
              {
                method: "post",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  email,
                  name,
                }),
              }
            );

            const customerObject = await customer.json();
        
            const user_id = getUserIdFromToken(access_token);
            const newUser = User.create({
                user_id,
                username:nickname,
                email,
                name,
                picture,
            })

            // need to store in db
            newUser.cus_id = customerObject.cus_id;

            const imgInstance = new Images({
                generatedBy: (await newUser).id,
                user_platform: [{
                    name: 'FIGMA',
                    user_platform_images: []
                }]
            })

            await imgInstance.save();

            console.log('img: ', imgInstance);
            
            return newUser;
        }

        // retrive a customer and share it

        return user;

    }catch(err){
        console.log(err);
        throw new Error(err);
    }
}

const Images = mongoose.model('Image', imagesSchema);
const User = mongoose.model('User', userSchema);

export {Images, User}