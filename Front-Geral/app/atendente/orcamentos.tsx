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
} from 'react-native';

import {
  useFocusEffect,
} from '@react-navigation/native';

import {
  orcamentos,
} from '@/data/orcamentos';

export default function Orcamentos() {

  const [
    listaOrcamentos,
    setListaOrcamentos,
  ] = useState([...orcamentos]);


  useFocusEffect(
    useCallback(() => {

      setListaOrcamentos(
        [...orcamentos]
      );

    }, [])
  );


  function aprovar(id: number) {

    const orcamento =
      orcamentos.find(
        (item) => item.id === id
      );

    if (!orcamento) {
      return;
    }

    orcamento.status = 'aprovado';

    setListaOrcamentos(
      [...orcamentos]
    );
  }


  return (
    <View style={styles.container}>

      <Text style={styles.titulo}>
        Orçamentos
      </Text>


      {listaOrcamentos.length === 0 ? (

        <View style={styles.vazioContainer}>

          <Text style={styles.vazio}>
            Nenhum orçamento criado.
          </Text>

        </View>

      ) : (

        <FlatList
          data={listaOrcamentos}

          keyExtractor={(item) =>
            item.id.toString()
          }

          contentContainerStyle={
            styles.lista
          }

          renderItem={({ item }) => (

            <View style={styles.card}>

              <View style={styles.topo}>

                <View style={styles.info}>

                  <Text style={styles.cliente}>
                    {item.cliente}
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


                <View
                  style={[
                    styles.status,
                    item.status === 'aprovado'
                      ? styles.statusAprovado
                      : styles.statusAnalise,
                  ]}
                >

                  <Text
                    style={[
                      styles.statusTexto,
                      item.status === 'aprovado'
                        ? styles.textoAprovado
                        : styles.textoAnalise,
                    ]}
                  >
                    {item.status}
                  </Text>

                </View>

              </View>


              <View style={styles.detalhes}>

                <Text>
                  Valor: {item.valor}
                </Text>

                <Text>
                  Prazo: {item.prazo}
                </Text>

                <Text>
                  Data: {item.data}
                </Text>

                {item.observacoes ? (
                  <Text>
                    Observações: {item.observacoes}
                  </Text>
                ) : null}

              </View>


              {item.status === 'em análise' && (

                <Pressable
                  style={styles.botaoAprovar}
                  onPress={() =>
                    aprovar(item.id)
                  }
                >

                  <Text
                    style={styles.botaoAprovarTexto}
                  >
                    MARCAR COMO APROVADO
                  </Text>

                </Pressable>

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