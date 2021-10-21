const state = require("./state.js")
const google = require('googleapis').google;
const customSearch = google.customsearch('v1');


const googleApiCredentials = require('../credentials/google-search.json');
async function robot(){
    const content = state.load();

    await fetchImagesOfAllSentences(content);
    state.save(content);


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
    
    
}

module.exports = robot;