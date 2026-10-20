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
import { useLocalSearchParams, router } from 'expo-router';

import { errorMessage, notify } from '@/services/dialog';
import {
  createQuote,
  formatMoney,
  getQuoteSuggestion,
  parseDateBr,
  parseMoney,
  type QuoteSuggestion,
} from '@/services/quotes';
import { listRequests, type ApiRequest } from '@/services/requests';

export default function NovoOrcamento() {
  const params = useLocalSearchParams<{ requisicaoId?: string }>();
  const requisicaoId = Number(params.requisicaoId);

  const [requisicao, setRequisicao] = useState<ApiRequest | null>(null);
  const [sugestao, setSugestao] = useState<QuoteSuggestion | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [valor, setValor] = useState('');
  const [prazo, setPrazo] = useState('');
  const [observacoes, setObservacoes] = useState('');

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      try {
        const lista = await listRequests();
        const encontrada = lista.find((item) => item.id === requisicaoId);

        if (!ativo) {
          return;
        }

        setRequisicao(encontrada ?? null);

        if (encontrada) {
          setSugestao(await getQuoteSuggestion(encontrada.id));
        }
      } catch (error) {
        notify('Erro', errorMessage(error));
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
  }, [requisicaoId]);

  if (carregando) {
    return (
      <View style={styles.erro}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!requisicao) {
    return (
      <View style={styles.erro}>
        <Text>Requisição não encontrada.</Text>
      </View>
    );
  }

  async function atualizarSugestao(palavras: string) {
    const quantidade = Number(palavras);

    if (!requisicao || !Number.isInteger(quantidade) || quantidade < 1) {
      return;
    }

    try {
      setSugestao(await getQuoteSuggestion(requisicao.id, quantidade));
    } catch (error) {
      notify('Erro', errorMessage(error));
    }
  }

  async function salvar() {
    if (!requisicao) {
      return;
    }

    const valorNormalizado = parseMoney(valor);

    if (!valorNormalizado) {
      notify('Atenção', 'Informe um valor válido para o orçamento.');
      return;
    }

    const prazoIso = parseDateBr(prazo);

    if (!prazoIso) {
      notify('Atenção', 'Informe o prazo no formato dd/mm/aaaa.');
      return;
    }

    setSalvando(true);

    try {
      await createQuote({
        request_id: requisicao.id,
        value: valorNormalizado,
        deadline: prazoIso,
        observations: observacoes.trim() || null,
      });

      notify('Sucesso', 'Orçamento criado com sucesso.', () =>
        router.replace('/atendente/orcamentos'),
      );
    } catch (error) {
      notify('Erro', errorMessage(error));
    } finally {
      setSalvando(false);
    }
  }

  const valorSugerido = sugestao?.suggested_value ?? null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <Pressable onPress={() => router.back()} style={styles.voltar}>
        <Text style={styles.voltarTexto}>← Voltar</Text>
      </Pressable>

      <Text style={styles.titulo}>Novo Orçamento</Text>

      <View style={styles.info}>
        <Text style={styles.infoTitulo}>Dados da requisição</Text>

        <Text style={styles.infoTexto}>Cliente: {requisicao.username}</Text>
        <Text style={styles.infoTexto}>E-mail: {requisicao.email}</Text>
        <Text style={styles.infoTexto}>Serviço: {requisicao.service_name}</Text>
        <Text style={styles.infoTexto}>
          Tradução: {requisicao.source_language_name}
          {' → '}
          {requisicao.target_language_name}
        </Text>
        <Text style={styles.infoTexto}>
          Palavras (estimativa): {requisicao.word_count ?? 'não informado'}
        </Text>
      </View>

      <View style={extra.sugestao}>
        {sugestao?.price_per_word == null ? (
          <Text style={extra.sugestaoTexto}>
            Não há preço por palavra cadastrado para esta combinação de serviço
            e idiomas.
          </Text>
        ) : (
          <>
            <Text style={extra.sugestaoTexto}>
              Preço por palavra: {formatMoney(sugestao.price_per_word)}
            </Text>

            {valorSugerido !== null ? (
              <Pressable
                onPress={() => setValor(valorSugerido.toFixed(2))}
                style={extra.sugestaoBotao}
              >
                <Text style={extra.sugestaoBotaoTexto}>
                  USAR VALOR SUGERIDO: {formatMoney(valorSugerido)}
                </Text>
              </Pressable>
            ) : (
              <Text style={extra.sugestaoTexto}>
                Informe a quantidade de palavras para calcular o valor.
              </Text>
            )}

            <TextInput
              placeholder="Recalcular com outra quantidade de palavras"
              keyboardType="numeric"
              onEndEditing={(evento) =>
                atualizarSugestao(evento.nativeEvent.text)
              }
              style={styles.input}
            />
          </>
        )}
      </View>

      <Text style={styles.label}>Valor *</Text>
      <TextInput
        value={valor}
        onChangeText={setValor}
        placeholder="Ex.: 850,00"
        keyboardType="decimal-pad"
        style={styles.input}
      />

      <Text style={styles.label}>Prazo (dd/mm/aaaa) *</Text>
      <TextInput
        value={prazo}
        onChangeText={setPrazo}
        placeholder="Ex.: 25/12/2026"
        style={styles.input}
      />

      <Text style={styles.label}>Observações</Text>
      <TextInput
        value={observacoes}
        onChangeText={setObservacoes}
        placeholder="Observações do orçamento"
        multiline
        numberOfLines={5}
        style={[styles.input, styles.textarea]}
      />

      <Text style={styles.label}>Status</Text>
      <View style={styles.status}>
        <Text style={styles.statusTexto}>Em análise</Text>
      </View>

      <Pressable
        style={[styles.salvar, salvando && { opacity: 0.6 }]}
        onPress={salvar}
        disabled={salvando}
      >
        <Text style={styles.salvarTexto}>
          {salvando ? 'SALVANDO...' : 'SALVAR ORÇAMENTO'}
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

const extra = StyleSheet.create({
  sugestao: {
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  sugestaoTexto: {
    color: '#444',
    marginBottom: 8,
  },
  sugestaoBotao: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    marginBottom: 8,
  },
  sugestaoBotaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
