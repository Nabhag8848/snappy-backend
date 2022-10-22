import crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

export function base64URLEncodeI(str) {
    return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export function sha256(buffer){
    return crypto.createHash('sha256')
    .update(buffer).digest();
}

export function getUserIdFromToken (token) {
    try{

        const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const userIdInfo = payload.sub.split('|');

        return userIdInfo[userIdInfo.length - 1];
    }catch(err){
        throw new Error("Error while getting Id");
    }
    
}

export function getUserIdFromSub(payload){

    try{
        const userIdInfo = payload.sub.split('|');
        return userIdInfo[userIdInfo.length - 1];
    }catch(err){
        throw new Error("Error while getting Id from sub");
    }

    
}

export function VerifySecretFromToken (token) {
    try {   

        const {aud} = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        const secret = aud[0];

        if(secret === process.env.AUDIENCE){
            return true;
        }

        return false;

    }catch(err){

        throw new Error("Error while verifying secret");
    }
} 