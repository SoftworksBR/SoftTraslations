import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import { confirmAction, errorMessage, notify } from '@/services/dialog';
import {
  approveQuote,
  formatDate,
  formatMoney,
  listQuotes,
  quoteStatusLabel,
  rejectQuote,
  type Quote,
} from '@/services/quotes';

export default function Orcamentos() {
  const [listaOrcamentos, setListaOrcamentos] = useState<Quote[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      setCarregando(true);
      listQuotes()
        .then((lista) => {
          if (ativo) {
            setListaOrcamentos(lista);
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

  function substituir(atualizado: Quote) {
    setListaOrcamentos((lista) =>
      lista.map((item) => (item.id === atualizado.id ? atualizado : item)),
    );
  }

  async function aprovar(id: number) {
    try {
      substituir(await approveQuote(id));
    } catch (error) {
      notify('Erro', errorMessage(error));
    }
  }

  function recusar(id: number) {
    confirmAction(
      'Recusar orçamento',
      'O cliente não aceitou o orçamento? A solicitação será marcada como recusada.',
      'Recusar',
      async () => {
        try {
          substituir(await rejectQuote(id));
        } catch (error) {
          notify('Erro', errorMessage(error));
        }
      },
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Orçamentos</Text>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : listaOrcamentos.length === 0 ? (
        <View style={styles.vazioContainer}>
          <Text style={styles.vazio}>Nenhum orçamento criado.</Text>
        </View>
      ) : (
        <FlatList
          data={listaOrcamentos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.topo}>
                <View style={styles.info}>
                  <Text style={styles.cliente}>{item.client_name}</Text>

                  <Text style={styles.servico}>{item.service_name}</Text>

                  <Text style={styles.idiomas}>
                    {item.source_language_name}
                    {' → '}
                    {item.target_language_name}
                  </Text>
                </View>

                <View
                  style={[
                    styles.status,
                    item.status === 'approved'
                      ? styles.statusAprovado
                      : item.status === 'rejected'
                        ? extra.statusRecusado
                        : styles.statusAnalise,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTexto,
                      item.status === 'approved'
                        ? styles.textoAprovado
                        : item.status === 'rejected'
                          ? extra.textoRecusado
                          : styles.textoAnalise,
                    ]}
                  >
                    {quoteStatusLabel[item.status]}
                  </Text>
                </View>
              </View>

              <View style={styles.detalhes}>
                <Text>Valor: {formatMoney(item.value)}</Text>
                <Text>Prazo: {formatDate(item.deadline)}</Text>
                <Text>Data: {formatDate(item.created_at)}</Text>

                {item.observations ? (
                  <Text>Observações: {item.observations}</Text>
                ) : null}
              </View>

              {item.status === 'in_review' && (
                <>
                  <Pressable
                    style={styles.botaoAprovar}
                    onPress={() => aprovar(item.id)}
                  >
                    <Text style={styles.botaoAprovarTexto}>
                      MARCAR COMO APROVADO
                    </Text>
                  </Pressable>

                  <Pressable
                    style={extra.botaoRecusar}
                    onPress={() => recusar(item.id)}
                  >
                    <Text style={extra.botaoRecusarTexto}>
                      MARCAR COMO RECUSADO
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
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
    padding: 16,
    marginBottom: 12,
  },

  topo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  info: {
    flex: 1,
  },

  cliente: {
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

  status: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
    alignSelf: 'flex-start',
  },

  statusAnalise: {
    backgroundColor: '#eee',
  },

  statusAprovado: {
    backgroundColor: '#000',
  },

  statusTexto: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },

  textoAnalise: {
    color: '#333',
  },

  textoAprovado: {
    color: '#fff',
  },

  detalhes: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 15,
    paddingTop: 12,
    gap: 6,
  },

  botaoAprovar: {
    backgroundColor: '#000',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 15,
  },

  botaoAprovarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

  vazioContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  vazio: {
    color: '#666',
    fontSize: 16,
  },

});

const extra = StyleSheet.create({
  statusRecusado: {
    backgroundColor: '#fdeaea',
  },
  textoRecusado: {
    color: '#b00020',
  },
  botaoRecusar: {
    borderWidth: 1,
    borderColor: '#b00020',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoRecusarTexto: {
    color: '#b00020',
    fontWeight: 'bold',
  },
});
