import { router } from 'expo-router';
import { tradutores } from '@/data/tradutores';
import { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';

const [listaTradutores, setListaTradutores] =
  useState([...tradutores]);

function textoStatus(status: string) {
  switch (status) {
    case 'aguardando_perfil':
      return 'Aguardando preenchimento do perfil';

    case 'aguardando_aprovacao':
      return 'Aguardando aprovação';

    case 'autorizado':
      return 'Autorizado';

    case 'reprovado':
      return 'Reprovado';

    default:
      return status;
  }
}

export default function Tradutores() {

  function novoTradutor() {
    router.push('/gestor/tradutores/novo');
  }

  function aprovarTradutor(id: number) {

    const tradutor = tradutores.find(
      (item) => item.id === id
    );

    if (!tradutor) return;

    tradutor.status = 'autorizado';

    setListaTradutores([
      ...tradutores,
    ]);
  }

  function reprovarTradutor(id: number) {

    const tradutor = tradutores.find(
      (item) => item.id === id
    );

    if (!tradutor) return;

    tradutor.status = 'reprovado';

    setListaTradutores([
      ...tradutores,
    ]);
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Tradutores
      </Text>

      <FlatList
        data={listaTradutores}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (
          <View style={styles.card}>

            <View style={styles.info}>

              <Text style={styles.nome}>
                {item.nome}
              </Text>

              <Text style={styles.id}>
                ID: {item.id}
              </Text>

              <Text style={styles.status}>
                {textoStatus(item.status)}
              </Text>

              {item.status === 'aguardando_aprovacao' && (
                <View style={styles.aprovacao}>

                  <Pressable
                    style={styles.aprovar}
                    onPress={() =>
                      aprovarTradutor(item.id)
                    }
                  >
                    <Text style={styles.aprovarTexto}>
                      APROVAR
                    </Text>
                  </Pressable>

                  <Pressable
                    style={styles.reprovar}
                    onPress={() =>
                      reprovarTradutor(item.id)
                    }
                  >
                    <Text style={styles.reprovarTexto}>
                      REPROVAR
                    </Text>
                  </Pressable>

                </View>
              )}

            </View>

            <Pressable
              style={styles.excluir}
              onPress={() => {}}
            >
              <Text style={styles.excluirText}>
                ×
              </Text>
            </Pressable>

          </View>
        )}
      />

      <Pressable
        style={styles.botao}
        onPress={novoTradutor}
      >
        <Text style={styles.botaoText}>
          PRÉ-CADASTRAR TRADUTOR
        </Text>
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  card: {
    minHeight: 100,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  info: {
    flex: 1,
    padding: 18,
    justifyContent: 'center',
  },

  nome: {
    fontSize: 19,
    fontWeight: 'bold',
  },

  id: {
    marginTop: 5,
    fontSize: 15,
    color: '#666',
  },

  status: {
    marginTop: 8,
    fontSize: 14,
    color: '#555',
  },

  excluir: {
    width: 65,
    borderLeftWidth: 1,
    borderLeftColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },

  excluirText: {
    fontSize: 30,
  },

  botao: {
    height: 55,
    borderWidth: 1,
    borderColor: '#000',
    borderRadius: 7,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },

  botaoText: {
    fontWeight: 'bold',
    fontSize: 15,
  },

  //aprovação

  aprovacao: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 10,
  },

  aprovar: {
    backgroundColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },

  aprovarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

  reprovar: {
    borderWidth: 1,
    borderColor: '#000',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },

  reprovarTexto: {
    color: '#000',
    fontWeight: 'bold',
  },
});