jest.mock('readline-sync');
jest.mock('../robots/state');

const readLine = require('readline-sync');
const state = require('../robots/state');
const robot = require('../robots/input');

describe('Input Robot', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('deve definir maximumSentences como 7', () => {
        readLine.question.mockReturnValue('Albert Einstein');
        readLine.keyInSelect.mockReturnValue(0);

        robot();

        expect(state.save).toHaveBeenCalledWith(
            expect.objectContaining({ maximumSentences: 7 })
        );
    });

    it('deve salvar o termo de pesquisa fornecido pelo usuário', () => {
        readLine.question.mockReturnValue('Marie Curie');
        readLine.keyInSelect.mockReturnValue(0);

        robot();

        expect(state.save).toHaveBeenCalledWith(
            expect.objectContaining({ searchTerm: 'Marie Curie' })
        );
    });

    it('deve salvar o prefixo "Quem é" quando o índice 0 é selecionado', () => {
        readLine.question.mockReturnValue('Albert Einstein');
        readLine.keyInSelect.mockReturnValue(0);

        robot();

        expect(state.save).toHaveBeenCalledWith(
            expect.objectContaining({ prefix: 'Quem é' })
        );
    });

    it('deve salvar o prefixo "O que é" quando o índice 1 é selecionado', () => {
        readLine.question.mockReturnValue('fotossíntese');
        readLine.keyInSelect.mockReturnValue(1);

        robot();

        expect(state.save).toHaveBeenCalledWith(
            expect.objectContaining({ prefix: 'O que é' })
        );
    });

    it('deve salvar o prefixo "A história do" quando o índice 2 é selecionado', () => {
        readLine.question.mockReturnValue('futebol');
        readLine.keyInSelect.mockReturnValue(2);

        robot();

        expect(state.save).toHaveBeenCalledWith(
            expect.objectContaining({ prefix: 'A história do' })
        );
    });

    it('deve chamar state.save exatamente uma vez', () => {
        readLine.question.mockReturnValue('Albert Einstein');
        readLine.keyInSelect.mockReturnValue(0);

        robot();

        expect(state.save).toHaveBeenCalledTimes(1);
    });

    it('deve perguntar o tema ao usuário', () => {
        readLine.question.mockReturnValue('Albert Einstein');
        readLine.keyInSelect.mockReturnValue(0);

        robot();

        expect(readLine.question).toHaveBeenCalledWith('Digite o tema do vídeo: ');
    });

    it('deve apresentar as opções de prefixo ao usuário', () => {
        readLine.question.mockReturnValue('Albert Einstein');
        readLine.keyInSelect.mockReturnValue(0);

        robot();

        expect(readLine.keyInSelect).toHaveBeenCalledWith(
            ['Quem é', 'O que é', 'A história do'],
            'Escolha uma opção'
        );
    });
});
