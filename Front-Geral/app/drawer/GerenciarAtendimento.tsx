import EmployeeManagementList from '@/components/EmployeeManagementList';

export default function GerenciamentoAtendimento() {
  return (
    <EmployeeManagementList
      role="atendimento"
      type="atendente"
      title="Atendente"
      addLabel="ADICIONAR ATENDENTE"
    />
  );
}
