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
      <View style={styles.center}>
        <ActivityIndicator color="#087F8C" />
      </View>
    );
  }

  if (!orcamento) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>
          Orçamento não encontrado ou já utilizado em outro projeto.
        </Text>
        <Pressable
          style={styles.salvar}
          onPress={() => router.replace('/gestor/orcamentos')}
        >
          <Text style={styles.salvarTexto}>Ver orçamentos</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>GESTÃO DE PROJETOS</Text>
      <Text style={styles.title}>Novo projeto</Text>
      <Text style={styles.muted}>
        Escolha as trilhas: as etapas são criadas automaticamente.
      </Text>

      <View style={styles.info}>
        <Text style={styles.infoTitulo}>Orçamento aprovado #{orcamento.id}</Text>
        <Text style={styles.muted}>Cliente: {orcamento.client_name}</Text>
        <Text style={styles.muted}>
          Serviço: {orcamento.service_name ?? 'Não informado'}
        </Text>
        <Text style={styles.muted}>
          Tradução: {orcamento.source_language_name}
          {' → '}
          {orcamento.target_language_name}
        </Text>
        <Text style={styles.muted}>
          {formatMoney(orcamento.value)} · prazo {formatDate(orcamento.deadline)}
        </Text>
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
      <Pressable onPress={() => router.back()} style={styles.link}>
        <Text style={styles.linkText}>Cancelar</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F8FA' },
  content: {
    padding: 24,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: '#F5F8FA',
  },
  eyebrow: { color: '#087F8C', fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title: { marginTop: 7, color: '#0B2239', fontSize: 29, fontWeight: '800' },
  muted: { marginTop: 4, color: '#627485', fontSize: 13, lineHeight: 19 },
  info: {
    marginTop: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  infoTitulo: { color: '#172B3A', fontSize: 16, fontWeight: '700' },
  label: { marginTop: 18, marginBottom: 6, color: '#172B3A', fontWeight: '600' },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#DFE7EC',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  salvar: {
    alignSelf: 'flex-start',
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#087F8C',
  },
  salvarTexto: { color: '#FFFFFF', fontWeight: '700' },
  link: { marginTop: 14 },
  linkText: { color: '#087F8C', fontWeight: '600' },
});