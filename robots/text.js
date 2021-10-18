const algorithmia = require("algorithmia");
const algorithmiaApiKey = require("../credentials/algorithmia.json").apiKey;
const axios = require("axios");

function robot(content){
    fetchContentFromWikipedia(content);
    
    //sanitizeContent(content);
    //breakContentIntoSentences(content);

    async function fetchContentFromWikipedia(content){
        const apiUrl =`https://pt.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&explaintext&redirects=1&titles=${content.searchTerm}`
        const wikipediaResponse = await axios.get(apiUrl);
        
        const wikipediaContent = wikipediaResponse.data;
        console.log(JSON.stringify(wikipediaContent.query.pages));
    }
}
module.exports = robot;