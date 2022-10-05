import crypto from 'crypto';

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
