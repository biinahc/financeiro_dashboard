/**
 * Mapeamento de apelidos (aliases) para colunas do Excel.
 * Permite que o sistema identifique colunas mesmo com nomes ligeiramente diferentes.
 */
export const colAliases = {
    peca: ['peça', 'peca', 'nome', 'produto', 'item', 'descrição da peça', 'descricao da peca', 'part', 'material não conforme', 'material nao conforme'],
    quantidade: ['quantidade', 'qtd', 'qtde', 'total', 'qt total', 'qtd total', 'qntd'],
    defeito: ['problema', 'defeito', 'falha', 'motivo', 'nqm', 'não conformidade', 'nao conformidade', 'descrição defeito', 'descricao defeito'],
    origem: ['origem', 'fornecedor', 'processo', 'causa'],
    codigo: ['código', 'codigo', 'cod', 'pn', 'part number', 'cód', 'cod.'],
    mes: ['mês', 'mes', 'periodo', 'período'],
    dataExact: ['dia', 'data', 'criado em', 'data de criação', 'data de criacao'],
    retornou: ['retornou', 'descartadas', 'descarte', 'retorno'],
    rsUnitario: ['r$ unitário', 'unitário', 'valor unitario', 'r$ unitario', 'unitario'],
    rsGeral: ['r$ geral', 'geral', 'valor total', 'valor geral', 'r$ geral']
};
