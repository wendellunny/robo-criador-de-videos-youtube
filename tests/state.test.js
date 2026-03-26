const fs = require('fs');

jest.mock('fs');

const state = require('../robots/state');

describe('State Robot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('save()', () => {
        it('deve serializar o conteúdo como JSON e gravar no arquivo', () => {
            const content = { searchTerm: 'Albert Einstein', prefix: 'Quem é' };

            state.save(content);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                './content.json',
                JSON.stringify(content)
            );
        });

        it('deve serializar objetos complexos corretamente', () => {
            const content = {
                searchTerm: 'Marie Curie',
                prefix: 'Quem é',
                maximumSentences: 7,
                sentences: [{ text: 'Primeira sentença.', keywords: [], images: [] }]
            };

            state.save(content);

            expect(fs.writeFileSync).toHaveBeenCalledWith(
                './content.json',
                JSON.stringify(content)
            );
        });
    });

    describe('load()', () => {
        it('deve ler e analisar o conteúdo do arquivo JSON', () => {
            const content = { searchTerm: 'Albert Einstein', prefix: 'Quem é' };
            fs.readFileSync.mockReturnValue(JSON.stringify(content));

            const result = state.load();

            expect(fs.readFileSync).toHaveBeenCalledWith('./content.json', 'utf-8');
            expect(result).toEqual(content);
        });

        it('deve retornar o objeto completo com todas as propriedades', () => {
            const content = {
                searchTerm: 'Marie Curie',
                prefix: 'Quem é',
                maximumSentences: 7,
                sentences: [{ text: 'Primeira sentença.', keywords: ['física'], images: [] }]
            };
            fs.readFileSync.mockReturnValue(JSON.stringify(content));

            const result = state.load();

            expect(result).toEqual(content);
            expect(result.sentences).toHaveLength(1);
            expect(result.sentences[0].keywords).toContain('física');
        });
    });

    describe('save() e load() em conjunto', () => {
        it('deve salvar e carregar o mesmo conteúdo', () => {
            const content = { searchTerm: 'Isaac Newton', prefix: 'Quem é', maximumSentences: 7 };
            let storedData;

            fs.writeFileSync.mockImplementation((path, data) => {
                storedData = data;
            });
            fs.readFileSync.mockImplementation(() => storedData);

            state.save(content);
            const result = state.load();

            expect(result).toEqual(content);
        });
    });
});
