import { useCallback, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import {
  ActivityIndicator,
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  deleteRequest,
  getRequests,
  type TranslationLanguage,
  type TranslationRequest,
} from '@/services/requests';

const languageLabels: Record<TranslationLanguage, string> = {
  portuguese: 'Português',
  english: 'Inglês',
  spanish: 'Espanhol',
  german: 'Alemão',
  italian: 'Italiano',
  french: 'Francês',
  other: 'Outro',
};

export default function Requisicoes() {
  const [listaRequisicoes, setListaRequisicoes] = useState<TranslationRequest[]>([]);
  const [aberto, setAberto] = useState<number | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const carregarRequisicoes = useCallback(async () => {
    setCarregando(true);
    try {
      setListaRequisicoes(await getRequests());
      setErro('');
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : 'Falha ao carregar solicitações.',
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregarRequisicoes();
    }, [carregarRequisicoes]),
  );

  function excluirRequisicao(id: number) {
    Alert.alert(
      'Excluir solicitação',
      'Tem certeza que deseja excluir esta solicitação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteRequest(id);
                setAberto(null);
                await carregarRequisicoes();
              } catch (error) {
                Alert.alert(
                  'Não foi possível excluir',
                  error instanceof Error ? error.message : 'Tente novamente.',
                );
              }
            })();
          },
        },
      ],
    );
  }

  function alternar(id: number) {

    if (aberto === id) {
      setAberto(null);
    } else {
      setAberto(id);
    }

  }

  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>
        Requisições
      </Text>

      {carregando ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={listaRequisicoes}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              {erro || 'Nenhuma solicitação cadastrada.'}
            </Text>
          }
          renderItem={({ item }) => {

          const expandido = aberto === item.id;

          return (
            <View style={styles.card}>

              <Pressable
                style={styles.cabecalho}
                onPress={() =>
                  alternar(item.id)
                }
              >

                <View style={styles.resumo}>

                  <Text style={styles.nome}>
                    {item.username}
                  </Text>

                  <Text style={styles.servico}>
                    {item.phone}
                  </Text>

                  <Text style={styles.idiomas}>
                    {languageLabels[item.translate_from]}
                    {' → '}
                    {languageLabels[item.translate_to]}
                  </Text>

                </View>

                <Text style={styles.seta}>
                  {expandido ? '▲' : '▼'}
                </Text>

              </Pressable>


              {expandido && (

                <View style={styles.detalhes}>

                  <Text style={styles.label}>
                    E-mail
                  </Text>

                  <Text style={styles.valor}>
                    {item.email}
                  </Text>


                  <Text style={styles.label}>
                    Telefone
                  </Text>

                  <Text style={styles.valor}>
                    {item.phone}
                  </Text>


                  <Text style={styles.label}>
                    Empresa
                  </Text>

                  <Text style={styles.valor}>
                    {item.company || 'Não informado'}
                  </Text>


                  <Text style={styles.label}>
                    Serviço
                  </Text>

                  <Text style={styles.valor}>
                    {item.phone}
                  </Text>


                  <Text style={styles.label}>
                    Tradução
                  </Text>

                  <Text style={styles.valor}>
                    {languageLabels[item.translate_from]}
                    {' → '}
                    {languageLabels[item.translate_to]}
                  </Text>


                  <Text style={styles.label}>
                    Observações
                  </Text>

                  <Text style={styles.valor}>
                    {item.observations || 'Nenhuma'}
                  </Text>

                  <Pressable
                    style={styles.botao}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/atendente/novo-orcamento',

                        params: {
                          requisicaoId:
                            item.id.toString(),
                        },
                      })
                    }
                  >

                    <Text style={styles.botaoTexto}>
                      CRIAR ORÇAMENTO
                    </Text>

                  </Pressable>

                  <Pressable
                    style={styles.botaoExcluir}
                    onPress={() =>
                        excluirRequisicao(item.id)
                    }
                    >
                    <Text style={styles.botaoExcluirTexto}>
                        EXCLUIR SOLICITAÇÃO
                    </Text>
                    </Pressable>

                </View>

              )}

            </View>
          );
          }}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  lista: {
    paddingBottom: 30,
  },

  vazio: {
    color: '#666',
    paddingVertical: 16,
  },

  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },

  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },

  resumo: {
    flex: 1,
  },

  nome: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  servico: {
    fontSize: 15,
    marginBottom: 3,
  },

  idiomas: {
    color: '#666',
  },

  seta: {
    fontSize: 16,
    marginLeft: 10,
  },

  detalhes: {
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    padding: 16,
  },

  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10,
  },

  valor: {
    fontSize: 15,
    marginTop: 3,
  },

  botao: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 20,
  },

  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

  botaoExcluir: {
    borderWidth: 1,
    borderColor: '#cc0000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
    },

    botaoExcluirTexto: {
    color: '#cc0000',
    fontWeight: 'bold',
    },
});