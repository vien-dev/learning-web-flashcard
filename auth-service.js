const jwt = require('jsonwebtoken');

let jwtSecret = 'Shhh! This is our secret.';
if ('JWT_SECRET' in process.env) {
    jwtSecret = process.env.JWT_SECRET;
}
let jwtAccessTokenSigningOptions = {expiresIn: '10m'};
let jwtRefreshTokenSigningOptions = {expiresIn: '3d'};

async function generateTokens(data) {
    let accessToken = await jwt.sign(data, jwtSecret, jwtAccessTokenSigningOptions);
    let refreshToken = await jwt.sign(data, jwtSecret, jwtRefreshTokenSigningOptions);

    return {accessToken, refreshToken};
}

async function refreshAccessToken(refreshToken) {
    try {
        let data = jwt.verify(refreshToken, jwtSecret);

        return await jwt.sign(data, jwtSecret, jwtAccessTokenSigningOptions);
    } catch(e) {
        console.log(e);
        throw e;
    }
}

//verify access token is valid or not
//Returns
//true: Valid
//false: Invalid
async function verifyAccessToken(accessToken) {
    try {
        await jwt.verify(accessToken, jwtSecret);

        return true;
    } catch(e) {
        console.log(e);
        return false;
    }
}

exports.generateTokens = generateTokens;
exports.refreshAccessToken = refreshAccessToken;
exports.verifyAccessToken = verifyAccessToken;
