export type StatusOrcamento =
  | 'em análise'
  | 'aprovado';

export type Orcamento = {
  id: number;

  requisicaoId: number;

  cliente: string;

  servico: string;

  traducaoDe: string;

  traducaoPara: string;

  valor: string;

  prazo: string;

  observacoes: string;

  status: StatusOrcamento;

  data: string;
};

export const orcamentos: Orcamento[] = [];