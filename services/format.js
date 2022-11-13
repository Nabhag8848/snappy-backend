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

        // having keys:
        data.key = process.env.STABLEDIFFUSIONKEY;

        const width = data.width;
        const height= data.height;
        const init_image = data.init_image;
        const prompt_strength =  data.prompt_strength;
        const num_inference_steps= data.num_inference_steps;
        const guidance_scale = data.guidance_scale;
        const seed = data.seed;
        const samples = data.samples;
        const negative_prompt = data.negative_prompt;

        if(!width){
            delete request.body.data.width;
        }
        
        if(!height){
            delete request.body.data.height;
        }

        if(!samples){
            delete request.body.data.samples;
        }

        if(!negative_prompt){
            delete request.body.data.negative_prompt;
        }
    
        if(prompt_strength){
            request.body.data.prompt_strength = parseFloat(request.body.data.prompt_strength)
        }else{
            delete request.body.data.prompt_strength;
        }
    
        if(!num_inference_steps){
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
        
        if(!init_image){
            delete request.body.data.init_image;
        }else {
    
            const img_res = await uploadImage(init_image);
            const url = img_res.secure_url.replace('.svg', '.png');
            request.body.data.init_image = url;
        }

        request.body.data.webhook = `${process.env.WEBHOOK}/images/webhook`// changes when in production
        
        return true;

    }catch (err){
        console.log(err)
       return err;
    }
}


async function uploadImage(imageBase64) {
    const uploadResponse = await cloudinary.v2.uploader.upload(imageBase64, {})
    return uploadResponse;
}

export async function requiredImageobj(inputs, predictionUrl){

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
            image_url: predictionUrl,
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