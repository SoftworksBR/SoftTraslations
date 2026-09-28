import EmployeeManagementList from '@/components/EmployeeManagementList';

export default function GerenciamentoAdministracao() {
  return (
    <EmployeeManagementList
      role="admin"
      type="administrador"
      title="Administrador"
      addLabel="ADICIONAR ADMINISTRADOR"
    />
  );
}
