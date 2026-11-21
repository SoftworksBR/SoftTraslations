export type DialogRequest = {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
  onOk?: () => void;
};

type DialogListener = (request: DialogRequest | null) => void;

let activeDialog: DialogRequest | null = null;
const listeners = new Set<DialogListener>();

function showDialog(request: DialogRequest) {
  activeDialog = request;
  listeners.forEach((listener) => listener(activeDialog));
}

export function subscribeToDialog(listener: DialogListener) {
  listeners.add(listener);
  listener(activeDialog);
  return () => {
    listeners.delete(listener);
  };
}

export function closeDialog(confirmed: boolean) {
  const request = activeDialog;
  activeDialog = null;
  listeners.forEach((listener) => listener(null));
  if (confirmed) {
    request?.onConfirm?.();
    request?.onOk?.();
  }
}

/** Presenta uma mensagem dentro do app, sem usar dialogs do navegador. */
export function notify(title: string, message: string, onOk?: () => void) {
  showDialog({ title, message, onOk });
}

/** Solicita confirmação dentro do app e só executa onConfirm após confirmar. */
export function confirmAction(
  title: string,
  message: string,
  confirmText: string,
  onConfirm: () => void,
) {
  showDialog({ title, message, confirmText, onConfirm });
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'Não foi possível concluir a operação.';
}
