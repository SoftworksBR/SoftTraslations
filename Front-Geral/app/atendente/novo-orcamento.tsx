import {
  useLocalSearchParams,
  router,
} from 'expo-router';

import {
  useState,
} from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';

import {
  requisicoes,
} from '@/data/requisicoes';

import {
  orcamentos,
} from '@/data/orcamentos';

export default function NovoOrcamento() {

  const params =
    useLocalSearchParams<{
      requisicaoId?: string;
    }>();

  const requisicaoId =
    Number(params.requisicaoId);

  const requisicao =
    requisicoes.find(
      (item) =>
        item.id === requisicaoId
    );

  const [valor, setValor] =
    useState('');

  const [prazo, setPrazo] =
    useState('');

  const [observacoes, setObservacoes] =
    useState('');


  if (!requisicao) {

    return (
      <View style={styles.erro}>

        <Text>
          Requisição não encontrada.
        </Text>

      </View>
    );

  }


  function salvar() {

    if (!valor.trim()) {

      Alert.alert(
        'Atenção',
        'Informe o valor do orçamento.'
      );

      return;
    }


    if (!prazo.trim()) {

      Alert.alert(
        'Atenção',
        'Informe o prazo.'
      );

      return;
    }


    const novoOrcamento = {

      id:
        orcamentos.length > 0
          ? Math.max(
              ...orcamentos.map(
                (item) => item.id
              )
            ) + 1
          : 1,

      requisicaoId:
        requisicao.id,

      cliente:
        requisicao.nome,

      servico:
        requisicao.servico,

      traducaoDe:
        requisicao.traducaoDe,

      traducaoPara:
        requisicao.traducaoPara,

      valor,

      prazo,

      observacoes,

      status: 'em análise' as const,

      data:
        new Date().toLocaleDateString(
          'pt-BR'
        ),
    };


    orcamentos.push(
      novoOrcamento
    );


    Alert.alert(
      'Sucesso',
      'Orçamento criado com sucesso.',
      [
        {
          text: 'OK',

          onPress: () =>
            router.replace(
              '/atendente/orcamentos'
            ),
        },
      ]
    );

  }


  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={
        styles.conteudo
      }
    >

      <Pressable
        onPress={() => router.back()}
        style={styles.voltar}
      >

        <Text style={styles.voltarTexto}>
          ← Voltar
        </Text>

      </Pressable>


      <Text style={styles.titulo}>
        Novo Orçamento
      </Text>


      <View style={styles.info}>

        <Text style={styles.infoTitulo}>
          Dados da requisição
        </Text>

        <Text style={styles.infoTexto}>
          Cliente: {requisicao.nome}
        </Text>

        <Text style={styles.infoTexto}>
          E-mail: {requisicao.email}
        </Text>

        <Text style={styles.infoTexto}>
          Serviço: {requisicao.servico}
        </Text>

        <Text style={styles.infoTexto}>
          Tradução: {requisicao.traducaoDe}
          {' → '}
          {requisicao.traducaoPara}
        </Text>

      </View>


      <Text style={styles.label}>
        Valor *
      </Text>

      <TextInput
        value={valor}
        onChangeText={setValor}
        placeholder="Ex.: R$ 850,00"
        style={styles.input}
      />


      <Text style={styles.label}>
        Prazo *
      </Text>

      <TextInput
        value={prazo}
        onChangeText={setPrazo}
        placeholder="Ex.: 5 dias úteis"
        style={styles.input}
      />


      <Text style={styles.label}>
        Observações
      </Text>

      <TextInput
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Observações do orçamento"
        multiline
        numberOfLines={5}
        style={[
          styles.input,
          styles.textarea,
        ]}
      />


      <Text style={styles.label}>
        Status
      </Text>

      <View style={styles.status}>

        <Text style={styles.statusTexto}>
          Em análise
        </Text>

      </View>


      <Pressable
        style={styles.salvar}
        onPress={salvar}
      >

        <Text style={styles.salvarTexto}>
          SALVAR ORÇAMENTO
        </Text>

      </Pressable>

    </ScrollView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  conteudo: {
    padding: 20,
    paddingBottom: 40,
  },

  voltar: {
    marginBottom: 15,
  },

  voltarTexto: {
    fontSize: 16,
    fontWeight: '600',
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  info: {
    backgroundColor: '#f3f3f3',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },

  infoTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 10,
  },

  infoTexto: {
    fontSize: 15,
    marginBottom: 5,
  },

  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 12,
  },

  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },

  textarea: {
    minHeight: 110,
    textAlignVertical: 'top',
  },

  status: {
    backgroundColor: '#eee',
    borderRadius: 6,
    padding: 12,
  },

  statusTexto: {
    fontSize: 16,
    fontWeight: '600',
  },

  salvar: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 25,
  },

  salvarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

  erro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

});