import { expressjwt } from 'express-jwt';
import jwks from 'jwks-rsa';
import * as dotenv from 'dotenv';
dotenv.config();

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

export { verifyJwt }