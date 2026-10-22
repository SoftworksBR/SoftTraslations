import { useEffect, useState } from 'react';

import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { OptionChips } from '@/components/OptionChips';
import { WebFilePicker } from '@/components/WebFilePicker';
import { errorMessage, notify } from '@/services/dialog';
import {
  createRequest,
  getPublicRequest,
  getRequestOptions,
  updatePublicRequest,
  uploadRequestFile,
  type RequestOptions,
} from '@/services/requests';

export default function FazerSolicitacao() {
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [opcoes, setOpcoes] = useState<RequestOptions | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [servicoId, setServicoId] = useState<number | null>(null);
  const [origemId, setOrigemId] = useState<number | null>(null);
  const [destinoId, setDestinoId] = useState<number | null>(null);
  const [palavras, setPalavras] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [arquivos, setArquivos] = useState<File[]>([]);

  const estaEditando = !!token;

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const [opcoesApi, existente] = await Promise.all([
          getRequestOptions(),
          token ? getPublicRequest(token) : Promise.resolve(null),
        ]);

        if (!ativo) {
          return;
        }

        setOpcoes(opcoesApi);

        if (existente) {
          setNome(existente.username);
          setEmail(existente.email);
          setTelefone(existente.phone);
          setEmpresa(existente.company ?? '');
          setServicoId(existente.service_id);
          setOrigemId(existente.source_language_id);
          setDestinoId(existente.target_language_id);
          setPalavras(existente.word_count ? String(existente.word_count) : '');
          setObservacoes(existente.observations ?? '');
        }
      } catch (error) {
        notify('Erro', errorMessage(error), () => router.back());
      } finally {
        if (ativo) {
          setCarregando(false);
        }
      }
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, [token]);

  function validar() {
    if (!nome.trim()) return 'Informe seu nome.';
    if (!email.trim()) return 'Informe seu e-mail.';
    if (!telefone.trim()) return 'Informe seu telefone.';
    if (servicoId === null) return 'Escolha o tipo de serviço.';
    if (origemId === null) return 'Escolha o idioma de origem.';
    if (destinoId === null) return 'Escolha o idioma de destino.';
    if (origemId === destinoId) {
      return 'Os idiomas de origem e destino devem ser diferentes.';
    }
    if (palavras.trim() && !/^\d+$/.test(palavras.trim())) {
      return 'A quantidade de palavras deve ser um número.';
    }
    return null;
  }

  async function enviar() {
    const problema = validar();

    if (problema) {
      notify('Atenção', problema);
      return;
    }

    const dados = {
      username: nome.trim(),
      email: email.trim(),
      phone: telefone.trim(),
      company: empresa.trim() || null,
      source_language_id: origemId as number,
      target_language_id: destinoId as number,
      service_id: servicoId as number,
      observations: observacoes.trim() || null,
      word_count: palavras.trim() ? Number(palavras.trim()) : null,
    };

    setEnviando(true);

    try {
      if (token) {
        await updatePublicRequest(token, dados);
        await enviarArquivos(token);
        notify('Sucesso', 'Solicitação atualizada com sucesso.', () =>
          router.replace('/orcamentos/MinhasSolicitacoes'),
        );
        return;
      }

      const criada = await createRequest(dados);
      await enviarArquivos(criada.public_token);
      notify('Sucesso', 'Solicitação enviada com sucesso.', () =>
        router.replace('/orcamentos/MinhasSolicitacoes'),
      );
    } catch (error) {
      notify('Erro', errorMessage(error));
    } finally {
      setEnviando(false);
    }
  }

  async function enviarArquivos(tokenSolicitacao: string) {
    for (const arquivo of arquivos) {
      await uploadRequestFile(tokenSolicitacao, arquivo, arquivo.name);
    }
  }

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator style={{ marginTop: 40 }} />
      </View>
    );
  }

  const idiomas = (opcoes?.languages ?? []).map((item) => ({
    id: item.id,
    label: item.name,
  }));
  const servicos = (opcoes?.services ?? []).map((item) => ({
    id: item.id,
    label: item.name,
  }));

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
    >
      <Pressable onPress={() => router.back()} style={styles.voltar}>
        <Text style={styles.voltarTexto}>← Voltar</Text>
      </Pressable>

      <Text style={styles.titulo}>
        {estaEditando ? 'Editar Solicitação' : 'Solicitar Orçamento'}
      </Text>

      <Text style={styles.label}>Nome *</Text>
      <TextInput
        value={nome}
        onChangeText={setNome}
        placeholder="Seu nome completo"
        style={styles.input}
      />

      <Text style={styles.label}>E-mail *</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="seu@email.com"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
      />

      <Text style={styles.label}>Telefone *</Text>
      <TextInput
        value={telefone}
        onChangeText={setTelefone}
        placeholder="(11) 99999-9999"
        keyboardType="phone-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Empresa</Text>
      <TextInput
        value={empresa}
        onChangeText={setEmpresa}
        placeholder="Nome da empresa (opcional)"
        style={styles.input}
      />

      <Text style={styles.label}>Tipo de Serviço *</Text>
      <OptionChips
        options={servicos}
        selected={servicoId === null ? [] : [servicoId]}
        onToggle={setServicoId}
        emptyText="Nenhum serviço disponível no momento."
      />

      <Text style={styles.label}>Traduzir de *</Text>
      <OptionChips
        options={idiomas}
        selected={origemId === null ? [] : [origemId]}
        onToggle={setOrigemId}
        emptyText="Nenhum idioma disponível no momento."
      />

      <Text style={styles.label}>Traduzir para *</Text>
      <OptionChips
        options={idiomas}
        selected={destinoId === null ? [] : [destinoId]}
        onToggle={setDestinoId}
        emptyText="Nenhum idioma disponível no momento."
      />

      <Text style={styles.label}>Quantidade de palavras (aproximada)</Text>
      <TextInput
        value={palavras}
        onChangeText={setPalavras}
        placeholder="Ex.: 1500 (opcional)"
        keyboardType="numeric"
        style={styles.input}
      />

      <Text style={styles.label}>Observações</Text>
      <TextInput
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Prazo desejado, detalhes do documento..."
        multiline
        numberOfLines={5}
        style={[styles.input, styles.textarea]}
      />

      <Text style={styles.label}>Anexos</Text>
      <WebFilePicker files={arquivos} onChange={setArquivos} />

      <Pressable
        style={[styles.enviar, enviando && { opacity: 0.6 }]}
        onPress={enviar}
        disabled={enviando}
      >
        <Text style={styles.enviarTexto}>
          {enviando
            ? 'ENVIANDO...'
            : estaEditando
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
