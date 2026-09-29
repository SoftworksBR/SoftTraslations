import { apiRequest } from './api';

export type Contato = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  cargo: string | null;
};

export type Departamento = {
  id: number;
  nome: string;
  contatos: Contato[];
};

export type Empresa = {
  id: number;
  razao_social: string;
  cnpj: string;
  departamentos: Departamento[];
};

export type ContatoInput = {
  nome: string;
  email: string;
  telefone: string;
  cargo?: string;
};

export type DepartamentoInput = {
  nome: string;
  contatos: ContatoInput[];
};

export type EmpresaInput = {
  razao_social: string;
  cnpj: string;
  departamentos: DepartamentoInput[];
};

export function getEmpresas() {
  return apiRequest<Empresa[]>('/empresas/');
}

export function createEmpresa(empresa: EmpresaInput) {
  return apiRequest<Empresa>('/empresas/', {
    method: 'POST',
    body: JSON.stringify(empresa),
  });
}
