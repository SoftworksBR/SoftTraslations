export type Role = 'admin' | 'projetos' | 'atendimento' | 'freelancer';

export type Employee = {
  id: number;
  username: string;
  email: string;
  role: Role;
  status: 'available' | 'busy' | 'pending';
};
