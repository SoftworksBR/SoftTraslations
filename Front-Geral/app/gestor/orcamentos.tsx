import { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import { errorMessage, notify } from '@/services/dialog';
import {
  formatDate,
  formatMoney,
  listQuotes,
  type Quote,
} from '@/services/quotes';

export default function Orcamentos() {
  const [orcamentos, setOrcamentos] = useState<Quote[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let ativo = true;

      setCarregando(true);
      listQuotes({ available_for_project: true })
        .then((lista) => {
          if (ativo) {
            setOrcamentos(lista);
          }
        })
        .catch((error) => notify('Erro', errorMessage(error)))
        .finally(() => {
          if (ativo) {
            setCarregando(false);
          }
        });

      return () => {
        ativo = false;
      };
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Orçamentos aprovados</Text>
      <Text style={styles.subtitle}>
        Orçamentos aprovados que ainda não viraram projeto.
      </Text>

      {carregando ? (
        <ActivityIndicator style={{ marginTop: 30 }} />
      ) : (
        <FlatList
          data={orcamentos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vazio}>
              Nenhum orçamento aprovado aguardando projeto.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cliente}>{item.client_name}</Text>
              <Text style={styles.texto}>{item.service_name}</Text>
              <Text style={styles.texto}>
                {item.source_language_name}
                {' → '}
                {item.target_language_name}
              </Text>
              <Text style={styles.texto}>Valor: {formatMoney(item.value)}</Text>
              <Text style={styles.texto}>
                Prazo: {formatDate(item.deadline)}
              </Text>
              {item.observations ? (
                <Text style={styles.texto}>
                  Observações: {item.observations}
                </Text>
              ) : null}

              <Pressable
                style={styles.botao}
                onPress={() =>
                  router.push({
                    pathname: '/gestor/novo-projeto',
                    params: { quoteId: item.id.toString() },
                  })
                }
              >
                <Text style={styles.botaoTexto}>CRIAR PROJETO</Text>
              </Pressable>
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
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  lista: {
    paddingBottom: 30,
  },
  vazio: {
    color: '#888',
    textAlign: 'center',
    marginTop: 30,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },
  cliente: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  texto: {
    color: '#444',
    marginBottom: 2,
  },
  botao: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
