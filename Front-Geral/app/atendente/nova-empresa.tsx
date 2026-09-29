import { router } from 'expo-router';
import { useState } from 'react';
import { createEmpresa } from '@/services/empresas';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

type ContatoForm = {
  nome: string;
  email: string;
  telefone: string;
  cargo: string;
};

type DepartamentoForm = {
  nome: string;
  contatos: ContatoForm[];
};

const CONTATO_VAZIO: ContatoForm = {
  nome: '',
  email: '',
  telefone: '',
  cargo: '',
};

export default function NovaEmpresa() {

  const [razaoSocial, setRazaoSocial] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [departamentos, setDepartamentos] = useState<DepartamentoForm[]>([]);
  const [salvando, setSalvando] = useState(false);

  function adicionarDepartamento() {
    setDepartamentos((atual) => [
      ...atual,
      { nome: '', contatos: [] },
    ]);
  }

  function atualizarNomeDepartamento(indice: number, nome: string) {
    setDepartamentos((atual) =>
      atual.map((departamento, i) =>
        i === indice ? { ...departamento, nome } : departamento,
      ),
    );
  }

  function adicionarContato(indiceDepartamento: number) {
    setDepartamentos((atual) =>
      atual.map((departamento, i) =>
        i === indiceDepartamento
          ? {
              ...departamento,
              contatos: [...departamento.contatos, { ...CONTATO_VAZIO }],
            }
          : departamento,
      ),
    );
  }

  function atualizarContato(
    indiceDepartamento: number,
    indiceContato: number,
    campo: keyof ContatoForm,
    valor: string,
  ) {
    setDepartamentos((atual) =>
      atual.map((departamento, i) =>
        i === indiceDepartamento
          ? {
              ...departamento,
              contatos: departamento.contatos.map((contato, j) =>
                j === indiceContato
                  ? { ...contato, [campo]: valor }
                  : contato,
              ),
            }
          : departamento,
      ),
    );
  }

  async function salvar() {
    if (!razaoSocial.trim()) {
      Alert.alert('Nova Empresa', 'Informe a razão social.');
      return;
    }

    if (!cnpj.trim()) {
      Alert.alert('Nova Empresa', 'Informe o CNPJ.');
      return;
    }

    for (const departamento of departamentos) {
      if (!departamento.nome.trim()) {
        Alert.alert(
          'Nova Empresa',
          'Informe o nome de todos os departamentos.',
        );
        return;
      }

      for (const contato of departamento.contatos) {
        if (
          !contato.nome.trim() ||
          !contato.email.trim() ||
          !contato.telefone.trim()
        ) {
          Alert.alert(
            'Nova Empresa',
            'Preencha nome, e-mail e telefone de todos os contatos.',
          );
          return;
        }
      }
    }

    setSalvando(true);
    try {
      await createEmpresa({
        razao_social: razaoSocial.trim(),
        cnpj: cnpj.trim(),
        departamentos: departamentos.map((departamento) => ({
          nome: departamento.nome.trim(),
          contatos: departamento.contatos.map((contato) => ({
            nome: contato.nome.trim(),
            email: contato.email.trim(),
            telefone: contato.telefone.trim(),
            ...(contato.cargo.trim()
              ? { cargo: contato.cargo.trim() }
              : {}),
          })),
        })),
      });
      router.back();
    } catch (error) {
      Alert.alert(
        'Não foi possível cadastrar a empresa',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>

      <Pressable style={styles.voltar} onPress={() => router.back()}>
        <Text style={styles.voltarTexto}>← Voltar</Text>
      </Pressable>

      <Text style={styles.title}>
        Nova Empresa
      </Text>

      <ScrollView contentContainerStyle={styles.conteudo}>

        <Text style={styles.label}>
          Razão social
        </Text>

        <TextInput
          value={razaoSocial}
          onChangeText={setRazaoSocial}
          placeholder="Nome da empresa"
          style={styles.input}
        />

        <Text style={styles.label}>
          CNPJ
        </Text>

        <TextInput
          value={cnpj}
          onChangeText={setCnpj}
          placeholder="00.000.000/0000-00"
          style={styles.input}
        />

        <Text style={styles.secao}>
          Departamentos
        </Text>

        {departamentos.length === 0 ? (
          <Text style={styles.helper}>Nenhum departamento adicionado.</Text>
        ) : (
          departamentos.map((departamento, indiceDepartamento) => (
            <View key={indiceDepartamento} style={styles.departamento}>

              <Text style={styles.label}>
                Nome do departamento
              </Text>

              <TextInput
                value={departamento.nome}
                onChangeText={(valor) =>
                  atualizarNomeDepartamento(indiceDepartamento, valor)
                }
                placeholder="Ex.: Financeiro"
                style={styles.input}
              />

              <Text style={styles.subSecao}>
                Contatos
              </Text>

              {departamento.contatos.length === 0 ? (
                <Text style={styles.helper}>Nenhum contato adicionado.</Text>
              ) : (
                departamento.contatos.map((contato, indiceContato) => (
                  <View key={indiceContato} style={styles.contato}>

                    <Text style={styles.label}>Nome</Text>
                    <TextInput
                      value={contato.nome}
                      onChangeText={(valor) =>
                        atualizarContato(
                          indiceDepartamento,
                          indiceContato,
                          'nome',
                          valor,
                        )
                      }
                      placeholder="Nome do contato"
                      style={styles.input}
                    />

                    <Text style={styles.label}>E-mail</Text>
                    <TextInput
                      value={contato.email}
                      onChangeText={(valor) =>
                        atualizarContato(
                          indiceDepartamento,
                          indiceContato,
                          'email',
                          valor,
                        )
                      }
                      placeholder="contato@empresa.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.input}
                    />

                    <Text style={styles.label}>Telefone</Text>
                    <TextInput
                      value={contato.telefone}
                      onChangeText={(valor) =>
                        atualizarContato(
                          indiceDepartamento,
                          indiceContato,
                          'telefone',
                          valor,
                        )
                      }
                      placeholder="(11) 99999-9999"
                      keyboardType="phone-pad"
                      style={styles.input}
                    />

                    <Text style={styles.label}>Cargo (opcional)</Text>
                    <TextInput
                      value={contato.cargo}
                      onChangeText={(valor) =>
                        atualizarContato(
                          indiceDepartamento,
                          indiceContato,
                          'cargo',
                          valor,
                        )
                      }
                      placeholder="Ex.: Gerente"
                      style={styles.input}
                    />

                  </View>
                ))
              )}

              <Pressable
                style={styles.botaoSecundario}
                onPress={() => adicionarContato(indiceDepartamento)}
              >
                <Text style={styles.botaoSecundarioTexto}>
                  + Adicionar contato
                </Text>
              </Pressable>

            </View>
          ))
        )}

        <Pressable
          style={styles.botaoSecundario}
          onPress={adicionarDepartamento}
        >
          <Text style={styles.botaoSecundarioTexto}>
            + Adicionar departamento
          </Text>
        </Pressable>

        <Pressable
          style={styles.botao}
          onPress={() => void salvar()}
          disabled={salvando}
        >
          <Text style={styles.botaoTexto}>
            {salvando ? 'CADASTRANDO...' : 'CADASTRAR EMPRESA'}
          </Text>
        </Pressable>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },

  voltar: {
    marginBottom: 15,
  },

  voltarTexto: {
    fontSize: 16,
    fontWeight: '600',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  conteudo: {
    paddingBottom: 40,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },

  secao: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 10,
  },

  subSecao: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  helper: {
    color: '#666',
    marginBottom: 8,
  },

  departamento: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },

  contato: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },

  botaoSecundario: {
    height: 44,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },

  botaoSecundarioTexto: {
    fontWeight: 'bold',
    fontSize: 14,
  },

  botao: {
    height: 52,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
