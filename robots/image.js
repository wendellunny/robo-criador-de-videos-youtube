const imageDownloader = require("image-downloader");
const state = require("./state.js")
const google = require('googleapis').google;
const gm = require('gm').subClass({imageMagick: true});
const customSearch = google.customsearch('v1');

const googletext = google.texttospeech('v1');




const googleApiCredentials = require('../credentials/google-search.json');
async function robot(){
    const content = state.load();

    await fetchImagesOfAllSentences(content);

    await downloadAllImages(content);

    await convertAllImages(content);

    await createAllSentenceImages(content);

    await createYoutubeThumbanail(content)
    state.save(content);

  async function teste(){
    await googletext.context()
  }
    async function fetchImagesOfAllSentences(content){
        for(const sentence of content.sentences){
            const query = `${content.searchTerm} ${sentence.keywords[0]}`;
            sentence.images = await fetchGoogleAndReturnImagesLinks(query);
            sentence.googleSearchQuery = query;
        }
    }
    
    async function fetchGoogleAndReturnImagesLinks(query){
        const response = await customSearch.cse.list({
            auth: googleApiCredentials.apiKey,
            cx: googleApiCredentials.searchEngineId,
            q: query,
            searchType:"image",

            num: 2
        });
        
        const imgsUrl = response.data.items.map((item)=>{
            return item.link
        })

        return imgsUrl;
    }

    async function downloadAllImages(content){
        content.downloadedImages = [];
        // console.log(content.sentences[0].images[0]);
        // content.sentences[1].images[0] ='https://static.wikia.nocookie.net/onepiece/images/6/6d/Monkey_D._Luffy_Anime_Post_Timeskip_Infobox.png/revision/latest?cb=20200429191518';
        // console.log(content.sentences[0].images[0]);
        // console.log(content.sentences[0].images);

        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++ ){
            const images = content.sentences[sentenceIndex].images;

            for(let imageIndex = 0; imageIndex < images.length; imageIndex++){
                const imageUrl = images[imageIndex];
                try{
                    if(content.downloadedImages.includes(imageUrl)){
                        throw new Error('Imagem já foi baixada'); 
                    }

                    await downloadAndSave(imageUrl,`${sentenceIndex}-original.png`);
                    //downloadImage();
                    content.downloadedImages.push(imageUrl);
                    console.log(`>[${sentenceIndex}][${imageIndex}] Baixou a imagem com sucesso ${imageUrl}`);
                    break;
                }catch(error){
                    console.log(`>[${sentenceIndex}][${imageIndex}] Erro ao baixar ${imageUrl}`);
                }
            }
        }
    }

    async function downloadAndSave(url,fileName){
        return imageDownloader.image({
            url, url,
            dest: `./content/${fileName}`
        })
    }

    async function convertAllImages(content){
        for (let sentenceIndex = 0 ; sentenceIndex < content.sentences.length;sentenceIndex++){
            await convertImage(sentenceIndex);
        }
    }

    async function convertImage(sentenceIndex){
        return new Promise((resolve,reject)=>{
            const inputFile = `./content/${sentenceIndex}-original.png[0]`;
            const outputFile = `./content/${sentenceIndex}-converted.png`;
            const width = 1920;
            const height = 1080;

            gm()
            .in(inputFile)
            .out('(')
              .out('-clone')
              .out('0')
              .out('-background', 'white')
              .out('-blur', '0x9')
              .out('-resize', `${width}x${height}^`)
            .out(')')
            .out('(')
              .out('-clone')
              .out('0')
              .out('-background', 'white')
              .out('-resize', `${width}x${height}`)
            .out(')')
            .out('-delete', '0')
            .out('-gravity', 'center')
            .out('-compose', 'over')
            .out('-composite')
            .out('-extent', `${width}x${height}`)
            .write(outputFile, (error) => {
              if (error) {
                return reject(error)
              }
    
              console.log(`> [video-robot] Image converted: ${outputFile}`)
              resolve()
            })
        })
    }

    async function createAllSentenceImages(content){
        for (let sentenceIndex = 0; sentenceIndex < content.sentences.length; sentenceIndex++){
            await createSentenceImage(sentenceIndex, content.sentences[sentenceIndex].text);

        }
    }

    async function createSentenceImage(sentenceIndex,sentenceText){
        return new Promise((resolve,reject)=>{
            const outputFile = `./content/${sentenceIndex}-sentence.png`;

            const templateSettings = {
                0: {
                  size: '1920x400',
                  gravity: 'center'
                },
                1: {
                  size: '1920x1080',
                  gravity: 'center'
                },
                2: {
                  size: '800x1080',
                  gravity: 'west'
                },
                3: {
                  size: '1920x400',
                  gravity: 'center'
                },
                4: {
                  size: '1920x1080',
                  gravity: 'center'
                },
                5: {
                  size: '800x1080',
                  gravity: 'west'
                },
                6: {
                  size: '1920x400',
                  gravity: 'center'
                }
        
              }
              gm()
              .out('-size', templateSettings[sentenceIndex].size)
              .out('-gravity', templateSettings[sentenceIndex].gravity)
              .out('-background', 'transparent')
              .out('-fill', 'white')
              .out('-kerning', '-1')
              .out(`caption:${sentenceText}`)
              .write(outputFile, (error) => {
                if (error) {
                  return reject(error)
                }
      
                console.log(`> [video-robot] Sentence created: ${outputFile}`)
                resolve()
              })
        })
    }
    
    async function createYoutubeThumbanail(){
        return new Promise((resolve,reject)=>{
            gm()
                .in('./content/0-converted.png')
                .write('./content/youtube-thumbnail.jpg',(error) =>{
                    if (error){
                        return reject(error);
                    }
                    console.log('> creating Youtube thumbnail ')
                    resolve();
                })
        });
    }
}

module.exports = robot;