import { useEffect, useState } from 'react';

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
  router,
  useLocalSearchParams,
} from 'expo-router';

import { requisicoes } from '@/data/requisicoes';

export default function FazerSolicitacao() {

  const { requisicaoId } =
    useLocalSearchParams<{
      requisicaoId?: string;
    }>();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [servico, setServico] = useState('');
  const [traducaoDe, setTraduzaoDe] = useState('');
  const [traducaoPara, setTraduzaoPara] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const estaEditando = !!requisicaoId;

  useEffect(() => {

    if (!requisicaoId) {
      return;
    }

    const id = Number(requisicaoId);

    const requisicao = requisicoes.find(
      (item) => item.id === id
    );

    if (!requisicao) {

      Alert.alert(
        'Erro',
        'Solicitação não encontrada.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

      return;
    }

    setNome(requisicao.nome);
    setEmail(requisicao.email);
    setTelefone(requisicao.telefone);
    setEmpresa(requisicao.empresa);
    setServico(requisicao.servico);
    setTraduzaoDe(requisicao.traducaoDe);
    setTraduzaoPara(requisicao.traducaoPara);
    setObservacoes(requisicao.observacoes);

  }, [requisicaoId]);

  function enviar() {

    if (!nome.trim()) {
      Alert.alert(
        'Atenção',
        'Informe seu nome.'
      );
      return;
    }

    if (!email.trim()) {
      Alert.alert(
        'Atenção',
        'Informe seu e-mail.'
      );
      return;
    }

    if (!telefone.trim()) {
      Alert.alert(
        'Atenção',
        'Informe seu telefone.'
      );
      return;
    }

    if (!servico.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o tipo de serviço.'
      );
      return;
    }

    if (!traducaoDe.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o idioma de origem.'
      );
      return;
    }

    if (!traducaoPara.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o idioma de destino.'
      );
      return;
    }

    /*
     * EDITAR SOLICITAÇÃO
     */
    if (estaEditando) {

      const id = Number(requisicaoId);

      const index = requisicoes.findIndex(
        (item) => item.id === id
      );

      if (index === -1) {

        Alert.alert(
          'Erro',
          'Solicitação não encontrada.'
        );

        return;
      }

      requisicoes[index] = {
        ...requisicoes[index],

        nome,
        email,
        telefone,
        empresa:
          empresa || 'Não informado',
        servico,
        traducaoDe,
        traducaoPara,
        observacoes,
      };

      Alert.alert(
        'Sucesso',
        'Solicitação atualizada com sucesso.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace(
                '/orcamentos/MinhasSolicitacoes'
              ),
          },
        ]
      );

      return;
    }

    /*
     * NOVA SOLICITAÇÃO
     */
    const novaRequisicao = {

      id:
        requisicoes.length > 0
          ? Math.max(
              ...requisicoes.map(
                (item) => item.id
              )
            ) + 1
          : 1,

      nome,
      email,
      telefone,
      empresa:
        empresa || 'Não informado',
      servico,
      traducaoDe,
      traducaoPara,
      observacoes,
      arquivos: [],
      data:
        new Date().toLocaleDateString(
          'pt-BR'
        ),
    };

    requisicoes.push(
      novaRequisicao
    );

    setNome('');
    setEmail('');
    setTelefone('');
    setEmpresa('');
    setServico('');
    setTraduzaoDe('');
    setTraduzaoPara('');
    setObservacoes('');

    Alert.alert(
      'Sucesso',
      'Solicitação enviada com sucesso.',
      [
        {
          text: 'OK',
          onPress: () =>
            router.replace(
              '/orcamentos/MinhasSolicitacoes'
            ),
        },
      ]
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
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
        {estaEditando
          ? 'Editar Solicitação'
          : 'Solicitar Orçamento'}
      </Text>

      <Text style={styles.label}>
        Nome *
      </Text>

      <TextInput
        value={nome}
        onChangeText={setNome}
        placeholder="Seu nome completo"
        style={styles.input}
      />

      <Text style={styles.label}>
        E-mail *
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <Text style={styles.label}>
        Telefone *
      </Text>

      <TextInput
        value={telefone}
        onChangeText={setTelefone}
        placeholder="(11) 99999-9999"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text style={styles.label}>
        Empresa
      </Text>

      <TextInput
        value={empresa}
        onChangeText={setEmpresa}
        placeholder="Nome da empresa (opcional)"
        style={styles.input}
      />

      <Text style={styles.label}>
        Tipo de Serviço *
      </Text>

      <TextInput
        value={servico}
        onChangeText={setServico}
        placeholder="Ex.: Tradução de contrato, documentação"
        style={styles.input}
      />

      <Text style={styles.label}>
        Traduzir de *
      </Text>

      <TextInput
        value={traducaoDe}
        onChangeText={setTraduzaoDe}
        placeholder="Ex.: Português"
        style={styles.input}
      />

      <Text style={styles.label}>
        Traduzir para *
      </Text>

      <TextInput
        value={traducaoPara}
        onChangeText={setTraduzaoPara}
        placeholder="Ex.: Inglês"
        style={styles.input}
      />

      <Text style={styles.label}>
        Observações
      </Text>

      <TextInput
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Observações adicionais"
        multiline
        numberOfLines={5}
        style={[
          styles.input,
          styles.textarea,
        ]}
      />

      <Pressable
        style={styles.enviar}
        onPress={enviar}
      >

        <Text style={styles.enviarTexto}>
          {estaEditando
            ? 'SALVAR ALTERAÇÕES'
            : 'ENVIAR SOLICITAÇÃO'}
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

  enviar: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 25,
  },

  enviarTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },

});

