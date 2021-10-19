const algorithmia = require("algorithmia");
const algorithmiaApiKey = require("../credentials/algorithmia.json").apiKey;
const axios = require("axios");

async function robot(content){
    await fetchContentFromWikipedia(content);
    
    sanitizeContent(content);
    //breakContentIntoSentences(content);

    async function fetchContentFromWikipedia(content){
        const apiUrl =`https://en.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&prop=extracts&explaintext&redirects=1&titles=${content.searchTerm}`
        const wikipediaResponse = await axios.get(apiUrl);
        const wikipediaContent = wikipediaResponse.data;
        content.sourceContentOriginal = wikipediaContent.query.pages[0].extract
    }

    function sanitizeContent(content){
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal);
        const withoutDatesInParentheses = removeDatesInParetheses(withoutBlankLinesAndMarkdown);
        console.log(withoutDatesInParentheses);

        function removeBlankLinesAndMarkdown(text){
            const allLines = text.split(`\n`);
           
            const withoutBlankLinesAndMarkdown = allLines.filter((line)=>{
                if(line.trim().length === 0 || line.trim().startsWith('=')){
                    return false;
                }
                return true;
            })

            return withoutBlankLinesAndMarkdown.join(' ');
        }

        function removeDatesInParetheses(text){
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm,'').replace(/  /g,' ');
        }

    }
}
module.exports = robot;