import { expressjwt } from 'express-jwt';
import jwks from 'jwks-rsa';
import * as dotenv from 'dotenv';
dotenv.config();
import { User } from '../model/user.js';
import { getUserIdFromSub } from '../services/authorization.js';

const verifyJwt = expressjwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${process.env.ISSUER}/.well-known/jwks.json`
    }),
    audience: `${process.env.AUDIENCE}`,
    issuer: `${process.env.ISSUER}/`, // note the slash gives error if not there
    algorithms: ['RS256']
})

const verifyUser = async function (req, res, next) {

    try {

        const _id = req.params.id; 
        const payload = req.auth;

        const user = await User.findOne({_id});
        console.log('User:  ', user);
        const user_id = user.user_id;

        const reqUserId = getUserIdFromSub(payload);

        if(reqUserId !== user_id){
            return res.status(401).send({
                status:401,
                response: "User not verified"
            });
        }
        next();
    }catch(err){
       return res.status(400).send(err);
    }
}

export { verifyJwt,verifyUser }