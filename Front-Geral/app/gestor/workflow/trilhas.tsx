import { router } from 'expo-router';

import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
} from 'react-native';

const trilhas = [
  {
    id: 1,
    nome: 'Tradução padrão',
    quadros: [
      'Receber arquivos',
      'Traduzir arquivos',
      'Emitir fatura',
    ],
  },
];

export default function Trilhas() {

  return (
    <View style={styles.container}>

      <Pressable
        style={styles.voltar}
        onPress={() => router.back()}
      >
        <Text style={styles.voltarText}>
          ← Voltar
        </Text>
      </Pressable>

      <Text style={styles.title}>
        Trilhas
      </Text>

      <FlatList
        data={trilhas}
        keyExtractor={(item) =>
          item.id.toString()
        }
        renderItem={({ item }) => (

          <View style={styles.card}>

            <Text style={styles.nome}>
              {item.nome}
            </Text>

            {item.quadros.map(
              (quadro, index) => (
                <View
                  key={quadro}
                  style={styles.etapa}
                >
                  <Text style={styles.numero}>
                    {index + 1}
                  </Text>

                  <Text style={styles.quadro}>
                    {quadro}
                  </Text>
                </View>
              )
            )}

          </View>

        )}
      />

      <Pressable
        style={styles.botao}
        onPress={() =>
          router.push(
            '/gestor/workflow/nova-trilha'
          )
        }
      >
        <Text style={styles.botaoText}>
          CRIAR NOVA TRILHA
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
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 18,
    marginBottom: 15,
  },

  nome: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  etapa: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  numero: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    color: '#fff',
    textAlign: 'center',
    paddingTop: 5,
    marginRight: 10,
  },

  quadro: {
    fontSize: 16,
  },

  botao: {
    height: 55,
    backgroundColor: '#000',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  botaoText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  
  voltar: {
    marginBottom: 15,
  },

  voltarText: {
    fontSize: 16,
    fontWeight: '600',
  },
});