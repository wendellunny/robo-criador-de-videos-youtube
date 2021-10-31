const gm = require('gm').subClass({imageMagick: true});
const Shell = require('shelljs')
const path =  require('path');
const rootPath = path.resolve(__dirname,'..')
const state = require("./state.js")

async function robot(){
    const content = state.load();
    await convertAllImages(content);

    await createAllSentenceImages(content);

    await createYoutubeThumbanail(content);

    await renderWithKdenLive();

    async function convertAllImages(content){
      console.log("> [Robô de Vídeo] Editando e convertendo imagens")
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
    
              console.log(`> [Robô de Vídeo] Imagem editada e convertida: ${outputFile}`)
              resolve()
            })
        })
    }

    async function createAllSentenceImages(content){
      console.log("> [Robô de Vídeo] Criando imagens das sentenças");
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
      
                console.log(`> [Robô de Vídeo] Sentença criada: ${outputFile}`)
                resolve()
              })
        })
    }
    
    async function createYoutubeThumbanail(){
      console.log('> [Robô de Vídeo] Criando a thumbnail do vídeo');
        return new Promise((resolve,reject)=>{
            gm()
                .in('./content/0-converted.png')
                .write('./content/youtube-thumbnail.jpg',(error) =>{
                    if (error){
                        return reject(error);
                    }
                   
                    resolve();
                })
        });
    }

    async function renderWithKdenLive(){
      console.log('> [Robô de Vídeo] Renderizando Vídeo');
      return new Promise((resolve,reject)=>{
        
        const renderVideo = Shell.exec('/home/lunny/Documents/scripts/video-maker-robot.sh',{silent:true},(code,stdout,stderr)=>{
            console.log('Video Renderizado com Sucesso');
            resolve();
        });
        
      })
    }
}


module.exports = robot;