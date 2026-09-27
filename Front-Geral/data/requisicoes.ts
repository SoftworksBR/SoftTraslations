export type Requisicao = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  empresa: string;
  servico: string;
  traducaoDe: string;
  traducaoPara: string;
  observacoes: string;
  arquivos: string[];
  data: string;
};

export const requisicoes: Requisicao[] = [
  {
    id: 1,
    nome: 'Carlos Silva',
    email: 'carlos@email.com',
    telefone: '(11) 99999-9999',
    empresa: 'Empresa Exemplo',
    servico: 'Tradução de documentos',
    traducaoDe: 'Português',
    traducaoPara: 'Inglês',
    observacoes: 'Necessário para o final do mês.',
    arquivos: [
      'documento.pdf',
      'contrato.pdf',
    ],
    data: '21/09/2026',
  },

  {
    id: 2,
    nome: 'Maria Oliveira',
    email: 'maria@email.com',
    telefone: '(11) 98888-8888',
    empresa: 'ABC Traduções',
    servico: 'Tradução juramentada',
    traducaoDe: 'Inglês',
    traducaoPara: 'Português',
    observacoes: 'Documento para processo de visto.',
    arquivos: [
      'certidao.pdf',
    ],
    data: '21/09/2026',
  },
];