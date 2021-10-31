const imageDownloader = require("image-downloader");
const state = require("./state.js")
const google = require('googleapis').google;

const customSearch = google.customsearch('v1');

const googleApiCredentials = require('../credentials/google-search.json');
async function robot(){
    const content = state.load();

    await fetchImagesOfAllSentences(content);
    await downloadAllImages(content);
    state.save(content);

    async function fetchImagesOfAllSentences(content){
        console.log("> [Robô de Imagem] Pesquisando imagens no Google Imagens");
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
        console.log("> [Robô de Imagem] Baixando Imagens");
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

   
}

module.exports = robot;