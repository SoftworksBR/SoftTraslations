import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';

import { confirmAction, errorMessage, notify } from '@/services/dialog';
import {
  deletePublicRequest,
  loadMyRequests,
  type PublicRequest,
  type RequestStatus,
} from '@/services/requests';
import { formatDate, formatMoney, quoteStatusLabel } from '@/services/quotes';

const statusLabel: Record<RequestStatus, string> = {
  pending: 'aguardando análise',
  quoted: 'orçamento enviado',
  rejected: 'recusada',
};

export default function MinhasSolicitacoes() {
  const [listaSolicitacoes, setListaSolicitacoes] = useState<
    PublicRequest[]
  >([]);
  const [carregando, setCarregando] = useState(true);
  const [aberto, setAberto] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      setCarregando(true);
      loadMyRequests()
        .then((lista) => {
          if (ativo) {
            setListaSolicitacoes(lista);
          }
        })
        .catch((error) => notify('Erro', errorMessage(error)))
        .finally(() => {
          if (ativo) {
            setCarregando(false);
          }
        });

      return () => {
        ativo = false;
      };
    }, []),
  );

  function alternar(id: number) {
    setAberto(aberto === id ? null : id);
  }

  function deletarSolicitacao(item: PublicRequest) {
    confirmAction(
      'Deletar solicitação',
      'Tem certeza que deseja deletar esta solicitação?',
      'Deletar',
      async () => {
        try {
          await deletePublicRequest(item.public_token);
          setListaSolicitacoes((lista) =>
            lista.filter((outra) => outra.id !== item.id),
          );
          if (aberto === item.id) {
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
      <Text style={styles.titulo}>Solicitações de Orçamento</Text>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : listaSolicitacoes.length === 0 ? (
        <View style={styles.vazioContainer}>
          <Text style={styles.vazio}>Nenhuma solicitação enviada.</Text>

          <Pressable
            style={styles.botaoNovo}
            onPress={() => router.push('/orcamentos/FazerSolicitacao')}
          >
            <Text style={styles.botaoNovoTexto}>+ FAZER SOLICITAÇÃO</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={listaSolicitacoes}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => {
            const expandido = aberto === item.id;
            const pendente = item.status === 'pending';

            return (
              <View style={styles.card}>
                <Pressable
                  style={styles.cabecalho}
                  onPress={() => alternar(item.id)}
                >
                  <View style={styles.resumo}>
                    <Text style={styles.servico}>
                      {item.service_name ?? 'Serviço não informado'}
                    </Text>

                    <Text style={styles.idiomas}>
                      {item.source_language_name}
                      {' → '}
                      {item.target_language_name}
                    </Text>

                    <Text style={styles.data}>
                      {formatDate(item.created_at)} · {statusLabel[item.status]}
                    </Text>
                  </View>

                  <Text style={styles.seta}>{expandido ? '▲' : '▼'}</Text>
                </Pressable>

                {expandido && (
                  <View style={styles.detalhes}>
                    {item.quote && (
                      <View style={extra.orcamento}>
                        <Text style={extra.orcamentoTitulo}>
                          Orçamento ({quoteStatusLabel[item.quote.status]})
                        </Text>
                        <Text>Valor: {formatMoney(item.quote.value)}</Text>
                        <Text>Prazo: {formatDate(item.quote.deadline)}</Text>
                        {item.quote.observations ? (
                          <Text>Observações: {item.quote.observations}</Text>
                        ) : null}
                      </View>
                    )}

                    <Text style={styles.label}>Nome</Text>
                    <Text style={styles.valor}>{item.username}</Text>

                    <Text style={styles.label}>E-mail</Text>
                    <Text style={styles.valor}>{item.email}</Text>

                    <Text style={styles.label}>Telefone</Text>
                    <Text style={styles.valor}>{item.phone}</Text>

                    <Text style={styles.label}>Empresa</Text>
                    <Text style={styles.valor}>
                      {item.company || 'Não informado'}
                    </Text>

                    {item.observations ? (
                      <>
                        <Text style={styles.label}>Observações</Text>
                        <Text style={styles.valor}>{item.observations}</Text>
                      </>
                    ) : null}

                    {item.files.length > 0 && (
                      <>
                        <Text style={styles.label}>Anexos</Text>
                        {item.files.map((arquivo) => (
                          <Text key={arquivo.id} style={styles.valor}>
                            📎 {arquivo.original_name}
                          </Text>
                        ))}
                      </>
                    )}

                    {pendente ? (
                      <>
                        <Pressable
                          style={styles.botaoEditar}
                          onPress={() =>
                            router.push({
                              pathname: '/orcamentos/FazerSolicitacao',
                              params: { token: item.public_token },
                            })
                          }
                        >
                          <Text style={styles.botaoEditarTexto}>EDITAR</Text>
                        </Pressable>

                        <Pressable
                          style={styles.botaoDeletar}
                          onPress={() => deletarSolicitacao(item)}
                        >
                          <Text style={styles.botaoDeletarTexto}>DELETAR</Text>
                        </Pressable>
                      </>
                    ) : (
                      <Text style={extra.aviso}>
                        Esta solicitação já foi analisada e não pode mais ser
                        alterada.
                      </Text>
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

  servico: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },

  idiomas: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },

  data: {
    fontSize: 12,
    color: '#999',
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

  vazioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  vazio: {
    color: '#666',
    fontSize: 16,
    marginBottom: 20,
  },

  botaoNovo: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },

  botaoNovoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

  botaoEditar: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },

  botaoEditarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

  botaoDeletar: {
    borderWidth: 1,
    borderColor: '#cc0000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },

  botaoDeletarTexto: {
    color: '#cc0000',
    fontWeight: 'bold',
  },

});

const extra = StyleSheet.create({
  orcamento: {
    backgroundColor: '#eef6ee',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  orcamentoTitulo: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  aviso: {
    color: '#666',
    marginTop: 12,
  },
});
