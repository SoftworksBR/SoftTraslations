import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { OptionChips } from '@/components/OptionChips';
import { errorMessage, notify } from '@/services/dialog';
import { createProject, listPaths, type Path } from '@/services/projects';
import {
  formatDate,
  formatMoney,
  listQuotes,
  type Quote,
} from '@/services/quotes';

export default function NovoProjeto() {
  const params = useLocalSearchParams<{ quoteId?: string }>();
  const quoteId = Number(params.quoteId);

  const [orcamento, setOrcamento] = useState<Quote | null>(null);
  const [trilhas, setTrilhas] = useState<Path[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [nome, setNome] = useState('');
  const [trilhasEscolhidas, setTrilhasEscolhidas] = useState<number[]>([]);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [disponiveis, todasTrilhas] = await Promise.all([
          listQuotes({ available_for_project: true }),
          listPaths(),
        ]);

        if (!ativo) {
          return;
        }

        const encontrado = disponiveis.find((item) => item.id === quoteId);

        setOrcamento(encontrado ?? null);
        setTrilhas(todasTrilhas);

        if (encontrado) {
          setNome(`${encontrado.client_name} - ${encontrado.service_name}`);
        }
      } catch (error) {
        notify('Erro', errorMessage(error));
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [quoteId]);

  function alternarTrilha(id: number) {
    setTrilhasEscolhidas((atual) =>
      atual.includes(id) ? atual.filter((item) => item !== id) : [...atual, id],
    );
  }

  async function salvar() {
    if (!orcamento) {
      return;
    }

    if (!nome.trim()) {
      notify('Atenção', 'Informe o nome do projeto.');
      return;
    }

    if (trilhasEscolhidas.length === 0) {
      notify('Atenção', 'Escolha ao menos uma trilha.');
      return;
    }

    setSalvando(true);

    try {
      await createProject({
        name: nome.trim(),
        quote_id: orcamento.id,
        path_ids: trilhasEscolhidas,
      });

      notify('Sucesso', 'Projeto criado com sucesso.', () =>
        router.replace('/gestor/projetos'),
      );
    } catch (error) {
      notify('Erro', errorMessage(error));
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 30 }} />
      </View>
    );
  }

  if (!orcamento) {
    return (
      <View style={styles.container}>
        <Text>
          Orçamento não encontrado ou já utilizado em outro projeto.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.voltar}>
        <Text style={styles.voltarTexto}>← Voltar</Text>
      </Pressable>

      <Text style={styles.title}>Novo Projeto</Text>

      <View style={styles.info}>
        <Text style={styles.infoTitulo}>Orçamento aprovado</Text>
        <Text>Cliente: {orcamento.client_name}</Text>
        <Text>Serviço: {orcamento.service_name}</Text>
        <Text>
          Tradução: {orcamento.source_language_name}
          {' → '}
          {orcamento.target_language_name}
        </Text>
        <Text>Valor: {formatMoney(orcamento.value)}</Text>
        <Text>Prazo: {formatDate(orcamento.deadline)}</Text>
      </View>

      <Text style={styles.label}>Nome do projeto *</Text>
      <TextInput
        value={nome}
        onChangeText={setNome}
        placeholder="Nome do projeto"
        style={styles.input}
      />

      <Text style={styles.label}>Trilhas *</Text>
      <OptionChips
        options={trilhas.map((item) => ({ id: item.id, label: item.name }))}
        selected={trilhasEscolhidas}
        onToggle={alternarTrilha}
        emptyText="Nenhuma trilha cadastrada. Crie uma em Workflow > Trilhas."
      />

      <Pressable
        style={[styles.salvar, salvando && { opacity: 0.6 }]}
        onPress={salvar}
        disabled={salvando}
      >
        <Text style={styles.salvarTexto}>
          {salvando ? 'CRIANDO...' : 'CRIAR PROJETO'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  voltar: {
    marginBottom: 15,
  },
  voltarTexto: {
    fontSize: 16,
    color: '#000',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  info: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  infoTitulo: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  salvar: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  salvarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
