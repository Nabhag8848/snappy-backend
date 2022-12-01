import cloudinary from 'cloudinary';
import * as dotenv from 'dotenv';
dotenv.config()

cloudinary.v2.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key ,
    api_secret: process.env.api_secret
})

export async function format(request){

    try {

        const data = request.body.data;
        const prompt = data.prompt;
        const width = data.width;
        const height= data.height;
        const init_image = data.init_image;
        const prompt_strength =  data.prompt_strength;
        const num_inference_steps= data.num_inference_steps;
        const guidance_scale = data.guidance_scale;
        const seed = data.seed;
        const samples = data.samples;
        const negative_prompt = data.negative_prompt;
        const webhook = `${process.env.WEBHOOK}/images/webhook`;

        const object = {
            key: process.env.STABLEDIFFUSIONKEY,
            prompt,
            height,
            width,
            init_image,
            prompt_strength,
            num_inference_steps,
            guidance_scale,
            seed,
            samples,
            negative_prompt,
            webhook
        }

        if(object.width === undefined){
            delete object.width;
        }
        
        if(object.height === undefined){
            delete object.height;
        }

        if(object.samples === undefined){
            delete object.samples;
        }

        if(object.negative_prompt === undefined){
            delete object.negative_prompt;
        }
    
        if(prompt_strength !== undefined){
            object.prompt_strength = parseFloat(object.prompt_strength)
        }else{
            delete object.prompt_strength;
        }
    
        if(num_inference_steps === undefined){
            delete object.num_inference_steps;
        }
    
        if(guidance_scale !== undefined){
            object.guidance_scale = parseFloat(object.guidance_scale);
        }else{
            delete object.guidance_scale;
        }
    
        if(seed !== undefined){
            object.seed = parseInt(object.seed);
        }else{
            delete object.seed;
        }
        
        if(init_image === undefined){
            delete object.init_image;
        }else {
    
            const img_res = await uploadImage(init_image);
            const url = img_res.secure_url.replace('.svg', '.png');
            object.init_image = url;
        }

        
        return object;

    }catch (err){
        console.log(err)
       return err;
    }
}


async function uploadImage(imageBase64) {
    const uploadResponse = await cloudinary.v2.uploader.upload(imageBase64, {})
    return uploadResponse;
}

export async function requiredImageobj(inputs){

    try {
        const width = inputs.width;
        const height= inputs.height;
        const num_inference_steps= inputs.num_inference_steps;
        const guidance_scale = inputs.guidance_scale;
        const seed = inputs.seed;
        const init_image = inputs.init_image;
        const prompt = inputs.prompt;
        const negative_prompt = inputs.negative_prompt;
        const prompt_strength =  inputs.prompt_strength;
    
        const object = { 
            type: "TEXT_TO_IMAGE",
            prompt,
            negative_prompt,
            seed,
            customizations: {
                guidance_scale,
                height,
                num_inference_steps,
                width,
                prompt_strength
            } 
        }

        if(!negative_prompt){
            delete object.negative_prompt;
        }
                
        if(width){
            object.customizations.width = parseInt(object.customizations.width);
        }else{
            delete object.customizations.width;
        }
    
        if(height){
            object.customizations.height = parseInt(object.customizations.height);
        }else{
            delete object.customizations.height;
        }
    
        if(num_inference_steps){
            object.customizations.num_inference_steps = parseInt(object.customizations.num_inference_steps);
        }else{
            delete object.customizations.num_inference_steps;
        }
    
        if(guidance_scale){
            object.customizations.guidance_scale = parseFloat(object.customizations.guidance_scale);
        }else{
            delete object.customizations.guidance_scale;
        }

        if(prompt_strength){
            object.customizations.prompt_strength = parseFloat(object.customizations.prompt_strength);
        }else{
            delete object.customizations.prompt_strength;
        }
    
        if(seed){
            object.seed = parseInt(object.seed);
        }else{
            delete object.seed;
        }
        
        if(object.customizations == { }){
            delete object.customizations;
        }
    
        if(init_image){
            object.type = "IMAGE_TO_IMAGE"
        }
        
        console.log('OBJECT: ', object);
        return object;

    }catch(err){
        throw new Error(err);
    }
}