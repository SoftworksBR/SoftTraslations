export type StatusTradutor =
  | 'aguardando_perfil'
  | 'aguardando_aprovacao'
  | 'autorizado'
  | 'reprovado';

export type Tradutor = {
  id: number;
  nome: string;
  senha: string;

  email: string;
  telefone: string;
  cpf: string;

  status: StatusTradutor;
};

export const tradutores: Tradutor[] = [
  {
    id: 1,
    nome: 'João Silva',
    senha: '123456',

    email: '',
    telefone: '',
    cpf: '',

    status: 'autorizado',
  },

  {
    id: 2,
    nome: 'Alek',
    senha: '123456',

    email: '',
    telefone: '',
    cpf: '',

    status: 'aguardando_perfil',
  },
];