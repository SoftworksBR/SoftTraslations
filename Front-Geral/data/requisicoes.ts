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

export const requisicoes: Requisicao[] = [];