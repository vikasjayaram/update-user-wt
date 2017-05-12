"use strict";

const moment = require('moment');
const request = require('request');
const bodyParser = require('body-parser');
const express = require('express');
const Webtask = require('webtask-tools');
const async = require('async');
const jwt = require('express-jwt@5.1.0');
const jwksRsa = require('jwks-rsa@1.1.1');
const app = express();

/*
 * Local variables
 */
let accessToken = null;
let lastLogin = null;
const JWKS_URI = 'https://{tenant}.auth0.com/.well-known/jwks.json';
const AUDIENCE = '{CLIENT_ID_OR_URN}';
const ISSUER = 'https://{tenant}.auth0.com/';
var jsonParser = bodyParser.json();

app.use(jwt({
    // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: JWKS_URI
    }),

    // Validate the audience and the issuer.
    audience: AUDIENCE,
    issuer: ISSUER,
    algorithms: ['RS256']
}));

app.get('/', function(req, res, next) {
    res.json({
        user: req.user
    });
});

app.post('/', jsonParser, function(req, res, next) {
    const context = req.webtaskContext;
    const reqBody = req.body;
    if (!reqBody || !reqBody['account_number']) {
        return res.status(400).json({
            error: 'account_number is required'
        });
    }
    context.body = reqBody;
    async.waterfall([
        async.apply(getAccessToken, context, req.user),
        updateUserProfile
    ], function(err, result) {
        if (err) return res.status(400).json({
            error: err
        });
        return res.status(200).json({
            data: result
        });
    });
});

/*
 * Request a Auth0 access token every 30 minutes
 */

function getAccessToken(context, decoded, cb) {
    if (!accessToken || !lastLogin || moment(new Date()).diff(lastLogin, 'minutes') > 30) {
        const options = {
            url: 'https://' + context.data.ACCOUNT_NAME + '.auth0.com/oauth/token',
            json: {
                audience: 'https://' + context.data.ACCOUNT_NAME + '.auth0.com/api/v2/',
                grant_type: 'client_credentials',
                client_id: context.data.CLIENT_ID,
                client_secret: context.data.CLIENT_SECRET
            }
        };

        return request.post(options, function(err, response, body) {
            if (err) return cb(err);
            else {
                lastLogin = moment();
                accessToken = body.access_token;
                return cb(null, context, decoded, accessToken);
            }
        });
    } else {
        return cb(null, context, decoded, accessToken);
    }
};

/*
 * Get the complete user profile with the update:users scope
 */

function updateUserProfile(context, decoded, token, cb) {
    const options = {
        url: 'https://' + context.data.ACCOUNT_NAME + '.auth0.com/api/v2/users/' + decoded.sub,
        json: {
            app_metadata: context.body
        },
        headers: {
            authorization: 'Bearer ' + token
        }
    };

    request.patch(options, function(error, response, user) {
        return cb(error, user);
    });
};

module.exports = Webtask.fromExpress(app);