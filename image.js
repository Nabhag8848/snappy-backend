import imageToBase64 from 'image-to-base64';
import compress from 'compress-str';
import cloudinary from 'cloudinary';
import * as dotenv from 'dotenv';
dotenv.config()

cloudinary.v2.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key ,
    api_secret: process.env.api_secret

})

export async function imagetobase64(image){

    const Base64 = await imageToBase64(image);
    // const result = compress.gzip(Base64)
    // .then((response) => {
    //    return response;
    // }).catch(err => {
    //   return err;
    // });


    return Base64;

}

async function formatData(request){

    try {

        const data = request.body.data;
        console.log(data);
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
        
        if(!init_image){
            delete request.body.data.init_image;
        }else {
    
            const img_res = await uploadImage(init_image);
            const url = img_res.secure_url.replace('.svg', '.png');
            request.body.data.init_image = url;
        }

        return true;

    }catch (err){
       return err;
    }
}

function getRequiredImageObject(id, inputs, predictionUrl){

    try {
        const width = inputs.width;
        const height= inputs.height;
        const num_inference_steps= inputs.num_inference_steps;
        const guidance_scale = inputs.guidance_scale;
        const seed = inputs.seed;
        const init_image = inputs.init_image;
        const prompt = inputs.prompt;
    
        const object = { 
            image_url: predictionUrl,
            generatedBy: id,
            type: "TEXT_TO_IMAGE",
            prompt: prompt,
            seed,
            customizations: {
                guidance_scale,
                height,
                num_inference_steps,
                width,
            } 
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
    
        return object;

    }catch(err){
        throw new Error(err);
    }

  
}

async function uploadImage(imageBase64) {
    const uploadResponse = await cloudinary.v2.uploader.upload(imageBase64, {})
    return uploadResponse;
}

export { formatData, getRequiredImageObject };