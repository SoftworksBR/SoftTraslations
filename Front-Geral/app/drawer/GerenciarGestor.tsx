import EmployeeManagementList from '@/components/EmployeeManagementList';

export default function GerenciamentoGestor() {
  return (
    <EmployeeManagementList
      role="projetos"
      type="gestor"
      title="Gestor"
      addLabel="ADICIONAR GESTOR"
    />
  );
}
