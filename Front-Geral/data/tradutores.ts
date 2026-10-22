export type Tradutor = {
  id: number;
  nome: string;
  email: string;
  status: 'pending' | 'available' | 'busy';
};

export const tradutores: Tradutor[] = [];