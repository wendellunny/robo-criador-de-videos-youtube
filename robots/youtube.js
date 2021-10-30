const express = require('express');
const google = require('googleapis').google;
const OAuth2 = google.auth.OAuth2;

const state = require("./state.js");

async function robot(){
    const content = state.load();

    await authenticateWithOAuth();
    // await uploadVideo();
    // await uploadThumbnail();

    async function authenticateWithOAuth(){
        const webServer =  await startWebServer();
        const OAuthClient = await createOAuthClient();
        requestUserConsent(OAuthClient);
        const authorizationToken = await waitForGoogleCallback(webServer);
        await requestGoogleForAccessTokens(OAuthClient,authorizationToken);
        await setGlobalGoogleAuthentication(OAuthClient);
        await stopWebServer(webServer);
        
        async function startWebServer(){
            return new Promise((resolve, reject)=>{
                const port = 5000;
                const app = express();

                const server = app.listen(port,()=>{
                    console.log(`> Listening on http://localhost:${port}`)
                })

                resolve({
                    app,
                    server
                })
            })
        }

        async function createOAuthClient(){
            const credentials = require('../credentials/google-youtube.json')
            const OAuthClient = new OAuth2(
                credentials.web.client_id,
                credentials.web.client_secret,
                credentials.web.redirect_uris[0]
            )
            return OAuthClient;
        }

        function requestUserConsent(OAuthClient){
            const consentUrl = OAuthClient.generateAuthUrl({
                access_type : "offline",
                scope: ['https://www.googleapis.com/auth/youtube']
            });
            console.log(`>Please give your consent: ${consentUrl} `);
        }

        async function waitForGoogleCallback(webServer){
            return new Promise((resolve,reject)=>{
                console.log('> Waiting for user consent...')

                webServer.app.get('/oauth2callback',(req,res)=>{
                    const authCode = req.query.code;
                    console.log(`> Consent given ${authCode}`);

                    res.send('<h1>Thank you!</h1><p>Now Close to tab<p/>')
                    resolve(authCode);
                })
            });
        }

        async function requestGoogleForAccessTokens(OAuthClient,authorizationToken){
            return new Promise((resolve,reject)=>{
                OAuthClient.getToken(authorizationToken, (error,tokens)=>{
                    if(error){
                        return reject(error);
                    }
                    console.log('> Access Tokens received: ');
                    console.log(tokens);

                    OAuthClient.setCredentials(tokens);
                    resolve();
                })
            });
        }

        function setGlobalGoogleAuthentication(OAuthClient){
            google.options({
                auth: OAuthClient
            });
        }


        async function stopWebServer(webServer){
            return new Promise((resolve,reject)=>{
                webServer.server.close(()=>{
                    resolve();
                })
            });
        }
   
    }


}

module.exports = robot;