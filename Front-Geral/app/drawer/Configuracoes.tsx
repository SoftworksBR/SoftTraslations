
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';

type Preco = {
  id: number;
  servico: string;
  origem: string;
  destino: string;
  valor: number;
};

const idiomasIniciais = ['Inglês', 'Espanhol', 'Português'];
const servicosIniciais = ['Tradução técnica'];

export default function Configuracoes() {
  const [idiomas, setIdiomas] = useState(idiomasIniciais);
  const [servicos, setServicos] = useState(servicosIniciais);
  const [precos, setPrecos] = useState<Preco[]>([
    {
      id: 1,
      servico: 'Tradução técnica',
      origem: 'Inglês',
      destino: 'Espanhol',
      valor: 0.25,
    },
  ]);

  const [novoIdioma, setNovoIdioma] = useState('');
  const [novoServico, setNovoServico] = useState('');
  const [servicoSelecionado, setServicoSelecionado] =
    useState('Tradução técnica');
  const [origemSelecionada, setOrigemSelecionada] =
    useState('Inglês');
  const [destinoSelecionado, setDestinoSelecionado] =
    useState('Espanhol');
  const [valorInformado, setValorInformado] = useState('0,25');

  function cadastrarIdioma() {
    const nome = novoIdioma.trim();

    if (!nome) {
      Alert.alert('Campo obrigatório', 'Informe o nome do idioma.');
      return;
    }

    if (idiomas.some((i) => i.toLowerCase() === nome.toLowerCase())) {
      Alert.alert('Idioma existente', 'Esse idioma já está cadastrado.');
      return;
    }

    setIdiomas((lista) => [...lista, nome]);
    setNovoIdioma('');
  }

  function excluirIdioma(nome: string) {
    const utilizado = precos.some(
      (p) => p.origem === nome || p.destino === nome
    );

    if (utilizado) {
      Alert.alert(
        'Não é possível excluir',
        'Esse idioma está sendo usado em um preço. Exclua o preço relacionado primeiro.'
      );
      return;
    }

    Alert.alert('Excluir idioma', `Deseja excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => setIdiomas((lista) => lista.filter((i) => i !== nome)),
      },
    ]);
  }

  function cadastrarServico() {
    const nome = novoServico.trim();

    if (!nome) {
      Alert.alert('Campo obrigatório', 'Informe o nome do serviço.');
      return;
    }

    if (servicos.some((s) => s.toLowerCase() === nome.toLowerCase())) {
      Alert.alert('Serviço existente', 'Esse serviço já está cadastrado.');
      return;
    }

    setServicos((lista) => [...lista, nome]);
    setServicoSelecionado(nome);
    setNovoServico('');
  }

  function excluirServico(nome: string) {
    const utilizado = precos.some((p) => p.servico === nome);

    if (utilizado) {
      Alert.alert(
        'Não é possível excluir',
        'Esse serviço está associado a um preço. Exclua o preço relacionado primeiro.'
      );
      return;
    }

    Alert.alert('Excluir serviço', `Deseja excluir "${nome}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          setServicos((lista) => lista.filter((s) => s !== nome));
          if (servicoSelecionado === nome) setServicoSelecionado('');
        },
      },
    ]);
  }

  function cadastrarPreco() {
    if (!servicos.includes(servicoSelecionado)) {
      Alert.alert('Serviço obrigatório', 'Selecione um serviço válido.');
      return;
    }

    if (
      !idiomas.includes(origemSelecionada) ||
      !idiomas.includes(destinoSelecionado)
    ) {
      Alert.alert('Idiomas obrigatórios', 'Selecione idiomas válidos.');
      return;
    }

    if (origemSelecionada === destinoSelecionado) {
      Alert.alert(
        'Combinação inválida',
        'O idioma de origem deve ser diferente do idioma de destino.'
      );
      return;
    }

    // Aceita valores como 0,25 ou 0.25.
    const textoValor = valorInformado.trim().replace(',', '.');

    if (!/^\d+(\.\d{1,2})?$/.test(textoValor)) {
      Alert.alert(
        'Preço inválido',
        'Informe um preço válido com até duas casas decimais. Ex.: 0,25'
      );
      return;
    }

    const valor = Number(textoValor);

    if (!Number.isFinite(valor) || valor < 0) {
      Alert.alert('Preço inválido', 'O preço não pode ser negativo.');
      return;
    }

    const duplicado = precos.some(
      (p) =>
        p.servico === servicoSelecionado &&
        p.origem === origemSelecionada &&
        p.destino === destinoSelecionado
    );

    if (duplicado) {
      Alert.alert(
        'Combinação existente',
        'Já existe um preço para esse serviço e par de idiomas. Exclua o preço anterior antes de cadastrá-lo novamente.'
      );
      return;
    }

    setPrecos((lista) => [
      ...lista,
      {
        id: Date.now(),
        servico: servicoSelecionado,
        origem: origemSelecionada,
        destino: destinoSelecionado,
        valor,
      },
    ]);

    setValorInformado('');
    Alert.alert('Sucesso', 'Preço cadastrado.');
  }

  function excluirPreco(id: number) {
    Alert.alert('Excluir preço', 'Deseja excluir esta combinação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => setPrecos((lista) => lista.filter((p) => p.id !== id)),
      },
    ]);
  }

  function formatarPreco(valor: number) {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }

  function Campo({
    titulo,
    valor,
    aoMudar,
    placeholder,
    teclado,
  }: {
    titulo: string;
    valor: string;
    aoMudar: (texto: string) => void;
    placeholder: string;
    teclado?: 'default' | 'decimal-pad';
  }) {
    return (
      <View style={styles.campo}>
        <Text style={styles.rotulo}>{titulo}</Text>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={aoMudar}
          placeholder={placeholder}
          keyboardType={teclado ?? 'default'}
          autoCapitalize="sentences"
        />
      </View>
    );
  }

  function Botao({
    titulo,
    aoPressionar,
    perigo = false,
  }: {
    titulo: string;
    aoPressionar: () => void;
    perigo?: boolean;
  }) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={aoPressionar}
        style={[styles.botao, perigo && styles.botaoPerigo]}
      >
        <Text style={[styles.botaoTexto, perigo && styles.textoPerigo]}>
          {titulo}
        </Text>
      </Pressable>
    );
  }

  function Selecao({
    titulo,
    opcoes,
    selecionado,
    aoSelecionar,
  }: {
    titulo: string;
    opcoes: string[];
    selecionado: string;
    aoSelecionar: (valor: string) => void;
  }) {
    return (
      <View style={styles.campo}>
        <Text style={styles.rotulo}>{titulo}</Text>
        {opcoes.length === 0 ? (
          <Text style={styles.vazio}>Cadastre opções primeiro.</Text>
        ) : (
          <View style={styles.opcoes}>
            {opcoes.map((opcao) => (
              <Pressable
                key={opcao}
                onPress={() => aoSelecionar(opcao)}
                style={[
                  styles.opcao,
                  selecionado === opcao && styles.opcaoSelecionada,
                ]}
              >
                <Text
                  style={[
                    styles.opcaoTexto,
                    selecionado === opcao && styles.opcaoTextoSelecionada,
                  ]}
                >
                  {opcao}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.tela}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.titulo}>Configurações</Text>
      <Text style={styles.subtitulo}>
        Gerencie os idiomas, serviços e preços da empresa.
      </Text>

      <View style={styles.card}>
        <Text style={styles.tituloSecao}>1. Idiomas</Text>
        <Campo
          titulo="Nome do idioma"
          valor={novoIdioma}
          aoMudar={setNovoIdioma}
          placeholder="Ex.: Francês"
        />
        <Botao titulo="Cadastrar idioma" aoPressionar={cadastrarIdioma} />

        {idiomas.map((idioma) => (
          <View key={idioma} style={styles.linha}>
            <Text style={styles.itemTexto}>{idioma}</Text>
            <Botao
              titulo="Excluir"
              perigo
              aoPressionar={() => excluirIdioma(idioma)}
            />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.tituloSecao}>2. Serviços prestados</Text>
        <Campo
          titulo="Nome do serviço"
          valor={novoServico}
          aoMudar={setNovoServico}
          placeholder="Ex.: Tradução juramentada"
        />
        <Botao titulo="Cadastrar serviço" aoPressionar={cadastrarServico} />

        {servicos.map((servico) => (
          <View key={servico} style={styles.linha}>
            <Text style={styles.itemTexto}>{servico}</Text>
            <Botao
              titulo="Excluir"
              perigo
              aoPressionar={() => excluirServico(servico)}
            />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.tituloSecao}>3. Preços por combinação</Text>
        <Text style={styles.ajuda}>
          Selecione um serviço, o idioma de origem, o destino e informe o preço.
        </Text>

        <Selecao
          titulo="Serviço"
          opcoes={servicos}
          selecionado={servicoSelecionado}
          aoSelecionar={setServicoSelecionado}
        />
        <Selecao
          titulo="Idioma de origem"
          opcoes={idiomas}
          selecionado={origemSelecionada}
          aoSelecionar={setOrigemSelecionada}
        />
        <Selecao
          titulo="Idioma de destino"
          opcoes={idiomas}
          selecionado={destinoSelecionado}
          aoSelecionar={setDestinoSelecionado}
        />
        <Campo
          titulo="Preço (R$)"
          valor={valorInformado}
          aoMudar={setValorInformado}
          placeholder="Ex.: 0,25"
          teclado="decimal-pad"
        />

        <Botao titulo="Cadastrar preço" aoPressionar={cadastrarPreco} />

        <Text style={styles.subtituloLista}>Preços cadastrados</Text>

        {precos.length === 0 ? (
          <Text style={styles.vazio}>Nenhum preço cadastrado.</Text>
        ) : (
          precos.map((preco) => (
            <View key={preco.id} style={styles.precoCard}>
              <Text style={styles.precoServico}>{preco.servico}</Text>
              <Text style={styles.itemTexto}>
                {preco.origem} → {preco.destino}
              </Text>
              <Text style={styles.precoValor}>
                {formatarPreco(preco.valor)}
              </Text>
              <Botao
                titulo="Excluir preço"
                perigo
                aoPressionar={() => excluirPreco(preco.id)}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  tela: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  conteudo: {
    padding: 20,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#171717',
  },
  subtitulo: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tituloSecao: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#171717',
    marginBottom: 14,
  },
  campo: {
    marginBottom: 14,
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#171717',
  },
  botao: {
    alignSelf: 'flex-start',
    backgroundColor: '#171717',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  botaoTexto: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  botaoPerigo: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc2626',
  },
  textoPerigo: {
    color: '#dc2626',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  itemTexto: {
    color: '#333',
    fontSize: 14,
    flexShrink: 1,
  },
  ajuda: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
  },
  opcoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  opcao: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 7,
    backgroundColor: '#fff',
  },
  opcaoSelecionada: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  opcaoTexto: {
    fontSize: 13,
    color: '#333',
  },
  opcaoTextoSelecionada: {
    color: '#fff',
    fontWeight: '600',
  },
  subtituloLista: {
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 18,
    marginBottom: 8,
    color: '#171717',
  },
  precoCard: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    gap: 8,
  },
  precoServico: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#171717',
  },
  precoValor: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#166534',
  },
  vazio: {
    color: '#777',
    fontSize: 13,
    paddingVertical: 8,
  },
});
