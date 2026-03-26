jest.mock('../credentials/watson.json', () => ({
    apikey: 'test-api-key',
    url: 'https://test.watson.example.com'
}), { virtual: true });

const mockAnalyze = jest.fn();
jest.mock('watson-developer-cloud/natural-language-understanding/v1.js', () => {
    return jest.fn().mockImplementation(() => ({ analyze: mockAnalyze }));
});

jest.mock('axios');
jest.mock('../robots/state');

const axios = require('axios');
const state = require('../robots/state');
const robot = require('../robots/text');

describe('Text Robot', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockAnalyze.mockImplementation((options, callback) => {
            callback(null, { keywords: [{ text: 'palavra-chave' }] });
        });
    });

    it('deve carregar o estado inicial', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences: 3
        });
        axios.get.mockResolvedValue({
            data: { query: { pages: [{ extract: 'Albert Einstein foi um físico. Ele nasceu em 1879.' }] } }
        });

        await robot();

        expect(state.load).toHaveBeenCalledTimes(1);
    });

    it('deve buscar conteúdo da Wikipedia com o termo de pesquisa correto', async () => {
        const searchTerm = 'Albert Einstein';
        state.load.mockReturnValue({ searchTerm, maximumSentences: 3 });
        axios.get.mockResolvedValue({
            data: { query: { pages: [{ extract: 'Albert Einstein foi um físico.' }] } }
        });

        await robot();

        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining(searchTerm)
        );
        expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('pt.wikipedia.org')
        );
    });

    it('deve salvar o estado após o processamento', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Marie Curie',
            maximumSentences: 3
        });
        axios.get.mockResolvedValue({
            data: { query: { pages: [{ extract: 'Marie Curie foi uma cientista polonesa. Ela ganhou o Nobel.' }] } }
        });

        await robot();

        expect(state.save).toHaveBeenCalledTimes(1);
    });

    it('deve remover linhas em branco e marcações de seção do conteúdo', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences: 7
        });
        axios.get.mockResolvedValue({
            data: {
                query: {
                    pages: [{
                        extract: 'Albert Einstein foi um físico.\n\n= Seção =\nEle nasceu em 1879.'
                    }]
                }
            }
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.sourceContentSanitized).not.toContain('= Seção =');
        expect(savedContent.sourceContentSanitized).toContain('Albert Einstein foi um físico.');
        expect(savedContent.sourceContentSanitized).toContain('Ele nasceu em 1879.');
    });

    it('deve remover datas entre parênteses do conteúdo', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences: 7
        });
        axios.get.mockResolvedValue({
            data: {
                query: {
                    pages: [{
                        extract: 'Albert Einstein (14 de março de 1879) foi um físico alemão.'
                    }]
                }
            }
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.sourceContentSanitized).not.toContain('(14 de março de 1879)');
        expect(savedContent.sourceContentSanitized).toContain('Albert Einstein');
    });

    it('deve dividir o conteúdo em sentenças', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences: 7
        });
        axios.get.mockResolvedValue({
            data: {
                query: {
                    pages: [{
                        extract: 'Albert Einstein foi um físico. Ele nasceu em 1879. Desenvolveu a teoria da relatividade.'
                    }]
                }
            }
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.sentences).toBeDefined();
        expect(Array.isArray(savedContent.sentences)).toBe(true);
        expect(savedContent.sentences.length).toBeGreaterThan(0);
    });

    it('deve limitar o número de sentenças ao máximo configurado', async () => {
        const maximumSentences = 2;
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences
        });
        axios.get.mockResolvedValue({
            data: {
                query: {
                    pages: [{
                        extract: 'Primeira sentença. Segunda sentença. Terceira sentença. Quarta sentença.'
                    }]
                }
            }
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.sentences.length).toBeLessThanOrEqual(maximumSentences);
    });

    it('deve criar objetos de sentença com texto, palavras-chave e imagens', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences: 7
        });
        axios.get.mockResolvedValue({
            data: {
                query: {
                    pages: [{
                        extract: 'Albert Einstein foi um físico teórico alemão.'
                    }]
                }
            }
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        const sentence = savedContent.sentences[0];
        expect(sentence).toHaveProperty('text');
        expect(sentence).toHaveProperty('keywords');
        expect(sentence).toHaveProperty('images');
        expect(Array.isArray(sentence.keywords)).toBe(true);
        expect(Array.isArray(sentence.images)).toBe(true);
    });

    it('deve extrair palavras-chave para cada sentença usando Watson NLU', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences: 7
        });
        axios.get.mockResolvedValue({
            data: {
                query: {
                    pages: [{
                        extract: 'Albert Einstein foi um físico teórico alemão.'
                    }]
                }
            }
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(mockAnalyze).toHaveBeenCalled();
        expect(savedContent.sentences[0].keywords).toContain('palavra-chave');
    });

    it('deve salvar o conteúdo original da Wikipedia no estado', async () => {
        const originalText = 'Albert Einstein foi um físico teórico alemão.';
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            maximumSentences: 7
        });
        axios.get.mockResolvedValue({
            data: { query: { pages: [{ extract: originalText }] } }
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.sourceContentOriginal).toBe(originalText);
    });
});
