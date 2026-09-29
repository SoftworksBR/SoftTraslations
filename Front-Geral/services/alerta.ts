import { Alert, Platform } from 'react-native';
import type { AlertButton } from 'react-native';

/**
 * `Alert.alert` do react-native-web não faz nada (é um no-op), então todo
 * aviso/erro fica invisível ao testar pelo navegador. Este helper resolve
 * isso usando window.alert/confirm no web, e delega pro Alert nativo nas
 * outras plataformas.
 */
export function alertar(
  titulo: string,
  mensagem?: string,
  botoes?: AlertButton[],
) {
  if (Platform.OS !== 'web') {
    Alert.alert(titulo, mensagem, botoes);
    return;
  }

  const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;

  if (!botoes || botoes.length <= 1) {
    window.alert(texto);
    botoes?.[0]?.onPress?.();
    return;
  }

  const confirmado = window.confirm(texto);
  const botaoConfirmar = botoes[botoes.length - 1];
  const botaoCancelar = botoes[0];

  if (confirmado) {
    botaoConfirmar.onPress?.();
  } else {
    botaoCancelar.onPress?.();
  }
}
