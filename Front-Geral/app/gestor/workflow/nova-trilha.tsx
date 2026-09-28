import { useCallback, useState } from 'react';
import { useFocusEffect, router } from 'expo-router';

import {
  ActivityIndicator,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';

import { createPath } from '@/services/paths';
import { getStages } from '@/services/stages';
import type { ProjectStage, ProjectStatus } from '@/services/projects';

const statusLabels: Record<ProjectStatus, string> = {
  ready: 'Pronto',
  in_progress: 'Em andamento',
  testing: 'Em teste',
  done: 'Concluído',
};

export default function NovaTrilha() {
  const [nome, setNome] = useState('');
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [loadingStages, setLoadingStages] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadStages = useCallback(async () => {
    setLoadingStages(true);
    try {
      setStages(await getStages());
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Falha ao carregar etapas.',
      );
    } finally {
      setLoadingStages(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStages();
    }, [loadStages]),
  );

  function selecionarQuadro(id: number) {

    setSelecionados((lista) => {

      if (lista.includes(id)) {
        return lista.filter(
          (item) => item !== id
        );
      }

      return [...lista, id];
    });
  }

  async function salvar() {
    if (!nome.trim() || selecionados.length === 0) {
      Alert.alert('Nova Trilha', 'Informe um nome e selecione ao menos um Stage.');
      return;
    }

    setSalvando(true);
    try {
      await createPath({
        name: nome.trim(),
        stage_ids: selecionados,
      });
      router.back();
    } catch (error) {
      Alert.alert(
        'Não foi possível criar a trilha',
        error instanceof Error ? error.message : 'Tente novamente.',
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <View style={styles.container}>

      <View style={styles.form}>

        <Text style={styles.title}>
          Nova Trilha
        </Text>

        <ScrollView>

          <Text style={styles.label}>
            Nome da trilha
          </Text>

          <TextInput
            value={nome}
            onChangeText={setNome}
            placeholder="Digite o nome"
            style={styles.input}
          />

          <Text style={styles.label}>
            Quadros da trilha
          </Text>

          {loadingStages ? (
            <ActivityIndicator />
          ) : stages.length === 0 ? (
            <Text style={styles.info}>
              {errorMessage || 'Nenhum Stage disponível para compor a trilha.'}
            </Text>
          ) : [...stages]
            .sort((left, right) => left.id - right.id)
            .map((stage) => {

            const selecionado =
              selecionados.includes(
                stage.id
              );

            return (
              <Pressable
                key={stage.id}
                style={[
                  styles.quadro,
                  selecionado &&
                    styles.quadroSelecionado,
                ]}
                onPress={() =>
                  selecionarQuadro(
                    stage.id
                  )
                }
              >
                <Text
                  style={
                    selecionado
                      ? styles.textoSelecionado
                      : styles.textoQuadro
                  }
                >
                  {selecionado ? '✓ ' : ''}
                  Etapa #{stage.id} · {statusLabels[stage.status]} · Freelancer #{stage.freelancer_id}
                </Text>
              </Pressable>
            );
          })}

          <Text style={styles.info}>
            Os Stages selecionados serão alocados nesta Trilha.
          </Text>

          <Pressable
            style={styles.botao}
            onPress={salvar}
            disabled={salvando || loadingStages || stages.length === 0}
          >
            <Text style={styles.botaoText}>
              {salvando ? 'SALVANDO...' : 'SALVAR TRILHA'}
            </Text>
          </Pressable>

        </ScrollView>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 25,
    maxHeight: '90%',
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 7,
  },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 6,
    paddingHorizontal: 12,
  },

  quadro: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginBottom: 8,
  },

  quadroSelecionado: {
    backgroundColor: '#ddd',
    borderColor: '#000',
  },

  textoQuadro: {
    fontSize: 16,
  },

  textoSelecionado: {
    fontSize: 16,
    fontWeight: 'bold',
  },

  info: {
    color: '#666',
    marginTop: 10,
    fontSize: 13,
  },

  botao: {
    height: 50,
    backgroundColor: '#000',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },

  botaoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});