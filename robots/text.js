const axios = require("axios");
const sentenceBoundaryDetection = require('sbd');
const watson = require('../credentials/watson.json');
var NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
    iam_apikey: watson.apikey,
    version: '2018-04-05',
    url: watson.url
    
  });
const state = require('./state.js');
  

async function robot(){
    const content = state.load();

    await fetchContentFromWikipedia(content);
    
    sanitizeContent(content);
    breakContentIntoSentences(content);
    limitMaximumSentences(content);
    await fetchKeyWordsOfAllSentences(content);

    state.save(content);
    async function fetchContentFromWikipedia(content){
        console.log('> [Robô de Texto] Pesquisando sobre o tema na web');
        const apiUrl =`https://pt.wikipedia.org/w/api.php?format=json&formatversion=2&action=query&prop=extracts&explaintext&redirects=1&titles=${content.searchTerm}`
        const wikipediaResponse = await axios.get(apiUrl);
        const wikipediaContent = wikipediaResponse.data;
        content.sourceContentOriginal = wikipediaContent.query.pages[0].extract
    }

    function sanitizeContent(content){
        console.log('> [Robô de Texto] Limpando conteúdo pesquisado');
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal);
        const withoutDatesInParentheses = removeDatesInParetheses(withoutBlankLinesAndMarkdown);
        
        content.sourceContentSanitized = withoutDatesInParentheses;

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
    function breakContentIntoSentences(content){
        content.sentences = [];
        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized);

        sentences.forEach((sentence) => {
            content.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            });
        });
    }

    function limitMaximumSentences(content){
        content.sentences = content.sentences.slice(0,content.maximumSentences);
    }

    async function fetchKeyWordsOfAllSentences(content){
        for(const sentence of content.sentences){
            sentence.keywords = await fetchWatsonAndReturnKeyWords(sentence.text);
        }
    }

    async function fetchWatsonAndReturnKeyWords(sentence){
        console.log("> [Robô de Texto] Criando palavras chaves com inteligência artificial");
        return new Promise((resolve,reject)=>{
            nlu.analyze({
                text: sentence, 
                features:{
                    keywords:{}
                }
            },(error,response)=>{
                if(error){
                    throw error;
                }
                const keywords = response.keywords.map((keyword) => {
                    return keyword.text
                });
    
                resolve(keywords);
            })
        })
    }
}
module.exports = robot;