const textToSpeech = require('@google-cloud/text-to-speech');
const state = require("./state.js")
// Import other required libraries
const fs = require('fs');
const util = require('util');
async function robot(){
  const content = state.load()
    const googleApiCredentials = require('../credentials/speech-text.json');
    const client = new textToSpeech.TextToSpeechClient({
        credentials: { 
          client_email:googleApiCredentials.client_email, 
          private_key: googleApiCredentials.private_key
        }
    });
    await createAllAudiosSentences(content)

  async function createAllAudiosSentences (content){
    
    for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){
      await createAudioSentence(sentenceIndex, content.sentences[sentenceIndex].text);

    }

  }

  async function createAudioSentence (sentenceIndex,sentenceText){
      const outputFile = `./audios/${sentenceIndex}-sentence.mp3`;
      console.log(`Audio content written to file: ${outputFile}`)
      // Construct the request
      const request = {
        input: {text: sentenceText},
        // Select the language and SSML voice gender (optional)
        voice: {languageCode: 'pt-BR', ssmlGender: 'pt-BR-Standard-A'},
        // select the type of audio encoding
        audioConfig: {audioEncoding: 'MP3',"pitch": -0.8,
        "speakingRate": 1.0},
      };
      const [response] = await client.synthesizeSpeech(request);
      // Write the binary audio content to a local file
      const writeFile = util.promisify(fs.writeFile);
      return writeFile(outputFile, response.audioContent, 'binary');
  
  }

}



module.exports = robot;
