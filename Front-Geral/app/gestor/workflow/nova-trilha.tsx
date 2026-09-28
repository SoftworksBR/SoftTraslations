import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';

import { router } from 'expo-router';

const quadros = [
  {
    id: 1,
    nome: 'Receber arquivos',
  },
  {
    id: 2,
    nome: 'Traduzir arquivos',
  },
  {
    id: 3,
    nome: 'Emitir fatura',
  },
];

export default function NovaTrilha() {

  const [nome, setNome] = useState('');

  const [selecionados, setSelecionados] =
    useState<number[]>([]);

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

  function salvar() {

    const trilha = {
      id: Date.now(),
      nome,
      quadros: selecionados,
    };

    console.log(
      'Nova trilha:',
      trilha
    );

    router.back();
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

          {quadros.map((quadro) => {

            const selecionado =
              selecionados.includes(
                quadro.id
              );

            return (
              <Pressable
                key={quadro.id}
                style={[
                  styles.quadro,
                  selecionado &&
                    styles.quadroSelecionado,
                ]}
                onPress={() =>
                  selecionarQuadro(
                    quadro.id
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
                  {quadro.nome}
                </Text>
              </Pressable>
            );
          })}

          <Text style={styles.info}>
            Os quadros serão utilizados na
            ordem em que forem selecionados.
          </Text>

          <Pressable
            style={styles.botao}
            onPress={salvar}
          >
            <Text style={styles.botaoText}>
              SALVAR TRILHA
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