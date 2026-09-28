import { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

import { requisicoes } from '@/data/requisicoes';

export default function Requisicoes() {

  const [listaRequisicoes, setListaRequisicoes] =
    useState([...requisicoes]);

    const [aberto, setAberto] =
    useState<number | null>(null);

    function excluirRequisicao(id: number) {
        Alert.alert(
            'Excluir solicitação',
            'Tem certeza que deseja excluir esta solicitação?',
            [
            {
                text: 'Cancelar',
                style: 'cancel',
            },
            {
                text: 'Excluir',
                style: 'destructive',
                onPress: () => {
                setListaRequisicoes((lista) =>
                    lista.filter(
                    (item) => item.id !== id
                    )
                );

                if (aberto === id) {
                    setAberto(null);
                }
                },
            },
            ]
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

      <FlatList
        data={listaRequisicoes}
        keyExtractor={(item) =>
          item.id.toString()
        }

        contentContainerStyle={styles.lista}

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
                    {item.nome}
                  </Text>

                  <Text style={styles.servico}>
                    {item.servico}
                  </Text>

                  <Text style={styles.idiomas}>
                    {item.traducaoDe}
                    {' → '}
                    {item.traducaoPara}
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
                    {item.telefone}
                  </Text>


                  <Text style={styles.label}>
                    Empresa
                  </Text>

                  <Text style={styles.valor}>
                    {item.empresa || 'Não informado'}
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


                  <Text style={styles.label}>
                    Observações
                  </Text>

                  <Text style={styles.valor}>
                    {item.observacoes || 'Nenhuma'}
                  </Text>


                  <Text style={styles.label}>
                    Arquivos
                  </Text>

                  {item.arquivos.length > 0 ? (

                    item.arquivos.map(
                      (arquivo, index) => (
                        <Text
                          key={index}
                          style={styles.arquivo}
                        >
                          📎 {arquivo}
                        </Text>
                      )
                    )

                  ) : (

                    <Text style={styles.valor}>
                      Nenhum arquivo
                    </Text>

                  )}


                  <Text style={styles.data}>
                    Solicitação: {item.data}
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