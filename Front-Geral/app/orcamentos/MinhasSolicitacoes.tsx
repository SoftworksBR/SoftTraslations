import {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import { router } from 'expo-router';

import {
  requisicoes,
} from '@/data/requisicoes';

export default function MinhasSolicitacoes() {

  const [
    listaSolicitacoes,
    setListaSolicitacoes,
  ] = useState([...requisicoes]);

  const [aberto, setAberto] =
    useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {

      setListaSolicitacoes(
        [...requisicoes]
      );

    }, [])
  );

  function alternar(id: number) {

    if (aberto === id) {
      setAberto(null);
    } else {
      setAberto(id);
    }

  }

  function deletarSolicitacao(id: number) {
    Alert.alert(
      'Deletar solicitação',
      'Tem certeza que deseja deletar esta solicitação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: () => {
            const index = requisicoes.findIndex(
              (item) => item.id === id
            );

            if (index > -1) {
              requisicoes.splice(index, 1);
            }

            setListaSolicitacoes(
              [...requisicoes]
            );

            if (aberto === id) {
              setAberto(null);
            }
          },
        },
      ]
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>
        Solicitações de Orçamento
      </Text>

      {listaSolicitacoes.length === 0 ? (

        <View style={styles.vazioContainer}>

          <Text style={styles.vazio}>
            Nenhuma solicitação enviada.
          </Text>

          <Pressable
            style={styles.botaoNovo}
            onPress={() =>
              router.push('/orcamentos/FazerSolicitacao')
            }
          >

            <Text style={styles.botaoNovoTexto}>
              + FAZER SOLICITAÇÃO
            </Text>

          </Pressable>

        </View>

      ) : (

        <FlatList
          data={listaSolicitacoes}

          keyExtractor={(item) =>
            item.id.toString()
          }

          contentContainerStyle={
            styles.lista
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

                    <Text style={styles.servico}>
                      {item.servico}
                    </Text>

                    <Text style={styles.idiomas}>
                      {item.traducaoDe}
                      {' → '}
                      {item.traducaoPara}
                    </Text>

                    <Text style={styles.data}>
                      {item.data}
                    </Text>

                  </View>

                  <Text style={styles.seta}>
                    {expandido ? '▲' : '▼'}
                  </Text>

                </Pressable>

                {expandido && (

                  <View style={styles.detalhes}>

                    <Text style={styles.label}>
                      Nome
                    </Text>

                    <Text style={styles.valor}>
                      {item.nome}
                    </Text>

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
                      {item.telefone}
                    </Text>

                    <Text style={styles.label}>
                      Empresa
                    </Text>

                    <Text style={styles.valor}>
                      {item.empresa}
                    </Text>

                    <Text style={styles.label}>
                      Serviço
                    </Text>

                    <Text style={styles.valor}>
                      {item.servico}
                    </Text>

                    <Text style={styles.label}>
                      Tradução
                    </Text>

                    <Text style={styles.valor}>
                      {item.traducaoDe}
                      {' → '}
                      {item.traducaoPara}
                    </Text>

                    {item.observacoes && (

                      <>

                        <Text style={styles.label}>
                          Observações
                        </Text>

                        <Text style={styles.valor}>
                          {item.observacoes}
                        </Text>

                      </>

                    )}

                    <Pressable
                      style={styles.botaoEditar}
                      onPress={() =>
                        router.push({
                          pathname: '/orcamentos/FazerSolicitacao',
                          params: {
                            requisicaoId: item.id.toString(),
                          },
                        })
                      }
                    >

                      <Text style={styles.botaoEditarTexto}>
                        EDITAR
                      </Text>

                    </Pressable>

                    <Pressable
                      style={styles.botaoDeletar}
                      onPress={() =>
                        deletarSolicitacao(item.id)
                      }
                    >

                      <Text style={styles.botaoDeletarTexto}>
                        DELETAR
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