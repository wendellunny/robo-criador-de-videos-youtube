const express = require('express');
const fs = require('fs');
const google = require('googleapis').google;
const youtube = google.youtube({version:"v3"});
const OAuth2 = google.auth.OAuth2;

const state = require("./state.js");

async function robot(){
    const content = state.load();

    await authenticateWithOAuth();
    const videoInformation = await uploadVideo(content);
    await uploadThumbnail(videoInformation);

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
                    console.log(`> [Robô Youtube] Escutando http://localhost:${port}`)
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
            console.log(`> [Robô Youtube] Escolha o canal a qual vai ser postado o vídeo e faça o consentimento: ${consentUrl} `);
        }

        async function waitForGoogleCallback(webServer){
            return new Promise((resolve,reject)=>{
                console.log('> [Robô Youtube] Esperando...')

                webServer.app.get('/oauth2callback',(req,res)=>{
                    const authCode = req.query.code;

                    res.send('<h1>Obrigaod</h1><p>Feche esta aba<p/>')
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

    async function uploadVideo(content){
        console.log('> [Robô Youtube] Upando Vídeo para o youtubee:')
        const videoFilePath = './content/output.mp4';
        const videoFileSize = fs.statSync(videoFilePath).size;
        const videoTitle = `${content.searchTerm}`;
        const videoTags = [content.searchTerm, ...content.sentences[0].keywords];
        const videoDescription = content.sentences.map((sentence)=>{
            return sentence.text
        }).join('\n\n');

        const requestParameters = {
            part: 'snippet, status',
            requestBody: {
                snippet: {
                    title: videoTitle,
                    description: videoDescription,
                    tags: videoTags,
                },
                status: {
                    privacyStatus: 'public'
                }
            },
            media:{
                body: fs.createReadStream(videoFilePath)
            }
        }

        const youtubeResponse = await youtube.videos.insert(requestParameters,{
            onUploadProgress: onUploadProgress
        });
        
        console.log(`> [Robô Youtube] Vídeo disponível em: https://youtu.be/${youtubeResponse.data.id}`);
        return youtubeResponse.data;

        function onUploadProgress(event){
            const progress = Math.round((event.bytesRead / videoFileSize)*100);
            console.log(`> [Robô Youtube] ${progress}% completados`)
        }
    }

    async function uploadThumbnail(videoInformation){
        const videoId = videoInformation.id;
        const videoThumbnailPath = './content/youtube-thumbnail.jpg';

        const requestParameters = {
            videoId: videoId,
            media:{
                mimiType: 'image/jpeg',
                body: fs.createReadStream(videoThumbnailPath)
            }
        }

        const youtubeResponse = await youtube.thumbnails.set(requestParameters);
        
        console.log('> [Robô Youtube] Thumbnail upada')


    }


}

module.exports = robot;