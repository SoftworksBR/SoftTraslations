import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { confirmAction, errorMessage, notify } from '@/services/dialog';
import { formatDate } from '@/services/quotes';
import {
  deleteRequest,
  listRequestFiles,
  listRequests,
  type ApiRequest,
  type RequestFile,
  type RequestStatus,
} from '@/services/requests';

const statusLabel: Record<RequestStatus, string> = {
  pending: 'pendente',
  quoted: 'orçada',
  rejected: 'recusada',
};

export default function Requisicoes() {
  const [listaRequisicoes, setListaRequisicoes] = useState<ApiRequest[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<number | null>(null);
  const [arquivos, setArquivos] = useState<Record<number, RequestFile[]>>({});
  const [somentePendentes, setSomentePendentes] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);

    try {
      setListaRequisicoes(
        await listRequests(somentePendentes ? { status: 'pending' } : {}),
      );
    } catch (error) {
      notify('Erro', errorMessage(error));
    } finally {
      setCarregando(false);
    }
  }, [somentePendentes]);

  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar]),
  );

  async function alternar(id: number) {
    if (aberto === id) {
      setAberto(null);
      return;
    }

    setAberto(id);

    if (!arquivos[id]) {
      try {
        const lista = await listRequestFiles(id);
        setArquivos((atual) => ({ ...atual, [id]: lista }));
      } catch (error) {
        notify('Erro', errorMessage(error));
      }
    }
  }

  function excluirRequisicao(id: number) {
    confirmAction(
      'Excluir solicitação',
      'Tem certeza que deseja excluir esta solicitação?',
      'Excluir',
      async () => {
        try {
          await deleteRequest(id);
          setListaRequisicoes((lista) =>
            lista.filter((item) => item.id !== id),
          );
          if (aberto === id) {
            setAberto(null);
          }
        } catch (error) {
          notify('Erro', errorMessage(error));
        }
      },
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Requisições</Text>

      <Pressable
        style={extra.filtro}
        onPress={() => setSomentePendentes((valor) => !valor)}
      >
        <Text style={extra.filtroTexto}>
          {somentePendentes
            ? 'Mostrando apenas pendentes (tocar para ver todas)'
            : 'Mostrando todas (tocar para ver só pendentes)'}
        </Text>
      </Pressable>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={listaRequisicoes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={extra.vazio}>Nenhuma requisição encontrada.</Text>
          }
          renderItem={({ item }) => {
            const expandido = aberto === item.id;
            const anexos = arquivos[item.id] ?? [];

            return (
              <View style={styles.card}>
                <Pressable
                  style={styles.cabecalho}
                  onPress={() => alternar(item.id)}
                >
                  <View style={styles.resumo}>
                    <Text style={styles.nome}>{item.username}</Text>

                    <Text style={styles.servico}>
                      {item.service_name ?? 'Serviço não informado'}
                    </Text>

                    <Text style={styles.idiomas}>
                      {item.source_language_name}
                      {' → '}
                      {item.target_language_name} · {statusLabel[item.status]}
                    </Text>
                  </View>

                  <Text style={styles.seta}>{expandido ? '▲' : '▼'}</Text>
                </Pressable>

                {expandido && (
                  <View style={styles.detalhes}>
                    <Text style={styles.label}>E-mail</Text>
                    <Text style={styles.valor}>{item.email}</Text>

                    <Text style={styles.label}>Telefone</Text>
                    <Text style={styles.valor}>{item.phone}</Text>

                    <Text style={styles.label}>Empresa</Text>
                    <Text style={styles.valor}>
                      {item.company || 'Não informado'}
                    </Text>

                    <Text style={styles.label}>Serviço</Text>
                    <Text style={styles.valor}>{item.service_name}</Text>

                    <Text style={styles.label}>Tradução</Text>
                    <Text style={styles.valor}>
                      {item.source_language_name}
                      {' → '}
                      {item.target_language_name}
                    </Text>

                    <Text style={styles.label}>Palavras (estimativa)</Text>
                    <Text style={styles.valor}>
                      {item.word_count ?? 'Não informado'}
                    </Text>

                    <Text style={styles.label}>Observações</Text>
                    <Text style={styles.valor}>
                      {item.observations || 'Nenhuma'}
                    </Text>

                    <Text style={styles.label}>Arquivos</Text>

                    {anexos.length > 0 ? (
                      anexos.map((arquivo) => (
                        <Text key={arquivo.id} style={styles.arquivo}>
                          📎 {arquivo.original_name}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.valor}>Nenhum arquivo</Text>
                    )}

                    <Text style={styles.data}>
                      Solicitação: {formatDate(item.created_at)}
                    </Text>

                    {item.status === 'pending' && (
                      <>
                        <Pressable
                          style={styles.botao}
                          onPress={() =>
                            router.push({
                              pathname: '/atendente/novo-orcamento',
                              params: { requisicaoId: item.id.toString() },
                            })
                          }
                        >
                          <Text style={styles.botaoTexto}>CRIAR ORÇAMENTO</Text>
                        </Pressable>

                        <Pressable
                          style={styles.botaoExcluir}
                          onPress={() => excluirRequisicao(item.id)}
                        >
                          <Text style={styles.botaoExcluirTexto}>
                            EXCLUIR SOLICITAÇÃO
                          </Text>
                        </Pressable>
                      </>
                    )}
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

  arquivo: {
    fontSize: 15,
    marginTop: 5,
  },

  data: {
    fontSize: 13,
    color: '#666',
    marginTop: 15,
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

const extra = StyleSheet.create({
  filtro: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  filtroTexto: {
    color: '#555',
    textDecorationLine: 'underline',
  },
  vazio: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
});
