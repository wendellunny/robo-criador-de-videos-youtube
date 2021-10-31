const readLine = require('readline-sync');
const state = require('./state.js');

function robot(){
    const content ={
        maximumSentences: 7
    };
    content.searchTerm = askAndReturnSearchTerm();
    content.prefix = askAndReturnPrefix();
    
    state.save(content);


    function askAndReturnSearchTerm(){
        return readLine.question('Digite o tema do vídeo: ');
    }

    function askAndReturnPrefix(){
        const prefixes = ['Quem é', 'O que é', 'A história do', ];
        const selectedPrefixIndex = readLine.keyInSelect(prefixes,'Escolha uma opção');
        const selectedPrefixText = prefixes[selectedPrefixIndex];
        return selectedPrefixText;
    }
}

module.exports = robot;