jest.mock('../credentials/google-search.json', () => ({
    apiKey: 'test-api-key',
    searchEngineId: 'test-engine-id'
}), { virtual: true });

const mockCseList = jest.fn();
jest.mock('googleapis', () => ({
    google: {
        customsearch: jest.fn().mockReturnValue({
            cse: { list: mockCseList }
        })
    }
}));

jest.mock('image-downloader');
jest.mock('../robots/state');

const imageDownloader = require('image-downloader');
const state = require('../robots/state');
const robot = require('../robots/image');

describe('Image Robot', () => {
    beforeEach(() => {
        jest.clearAllMocks();

        mockCseList.mockResolvedValue({
            data: {
                items: [
                    { link: 'https://example.com/image1.jpg' },
                    { link: 'https://example.com/image2.jpg' }
                ]
            }
        });

        imageDownloader.image.mockResolvedValue({});
    });

    it('deve carregar o estado inicial', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] }
            ]
        });

        await robot();

        expect(state.load).toHaveBeenCalledTimes(1);
    });

    it('deve salvar o estado após o processamento', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] }
            ]
        });

        await robot();

        expect(state.save).toHaveBeenCalledTimes(1);
    });

    it('deve buscar imagens do Google para cada sentença', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] },
                { text: 'Nasceu em 1879.', keywords: ['nascimento'], images: [] }
            ]
        });

        await robot();

        expect(mockCseList).toHaveBeenCalledTimes(2);
    });

    it('deve construir a consulta de pesquisa combinando o termo e a primeira palavra-chave', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['relatividade'], images: [] }
            ]
        });

        await robot();

        expect(mockCseList).toHaveBeenCalledWith(
            expect.objectContaining({ q: 'Albert Einstein relatividade' })
        );
    });

    it('deve salvar a consulta de pesquisa em cada sentença', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Marie Curie',
            sentences: [
                { text: 'Marie Curie foi uma cientista.', keywords: ['Nobel'], images: [] }
            ]
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.sentences[0].googleSearchQuery).toBe('Marie Curie Nobel');
    });

    it('deve armazenar os links das imagens encontradas em cada sentença', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] }
            ]
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.sentences[0].images).toContain('https://example.com/image1.jpg');
    });

    it('deve baixar as imagens encontradas para cada sentença', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] }
            ]
        });

        await robot();

        expect(imageDownloader.image).toHaveBeenCalled();
    });

    it('deve salvar as imagens baixadas com o nome correto', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] }
            ]
        });

        await robot();

        expect(imageDownloader.image).toHaveBeenCalledWith(
            expect.objectContaining({ dest: './content/0-original.png' })
        );
    });

    it('deve registrar as URLs das imagens baixadas para evitar duplicatas', async () => {
        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] }
            ]
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        expect(savedContent.downloadedImages).toBeDefined();
        expect(Array.isArray(savedContent.downloadedImages)).toBe(true);
        expect(savedContent.downloadedImages.length).toBeGreaterThan(0);
    });

    it('deve pular imagens já baixadas anteriormente', async () => {
        const duplicateUrl = 'https://example.com/image1.jpg';
        mockCseList.mockResolvedValue({
            data: {
                items: [
                    { link: duplicateUrl },
                    { link: 'https://example.com/image2.jpg' }
                ]
            }
        });

        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Primeira sentença.', keywords: ['física'], images: [] },
                { text: 'Segunda sentença.', keywords: ['teoria'], images: [] }
            ]
        });

        await robot();

        const savedContent = state.save.mock.calls[0][0];
        const uniqueImages = new Set(savedContent.downloadedImages);
        expect(savedContent.downloadedImages.length).toBe(uniqueImages.size);
    });

    it('deve continuar processando se o download de uma imagem falhar', async () => {
        imageDownloader.image
            .mockRejectedValueOnce(new Error('Download falhou'))
            .mockResolvedValue({});

        state.load.mockReturnValue({
            searchTerm: 'Albert Einstein',
            sentences: [
                { text: 'Einstein foi um físico.', keywords: ['físico'], images: [] }
            ]
        });

        await expect(robot()).resolves.not.toThrow();
    });
});
