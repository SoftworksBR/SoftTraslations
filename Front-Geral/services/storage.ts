// Armazenamento simples chave/valor.
// Na web usa localStorage; nas demais plataformas guarda em memória
// (some ao fechar o app).
const memory = new Map<string, string>();

function webStorage(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function getItem(key: string): string | null {
  const storage = webStorage();
  return storage ? storage.getItem(key) : (memory.get(key) ?? null);
}

export function setItem(key: string, value: string) {
  const storage = webStorage();
  if (storage) {
    storage.setItem(key, value);
  } else {
    memory.set(key, value);
  }
}

export function removeItem(key: string) {
  const storage = webStorage();
  if (storage) {
    storage.removeItem(key);
  } else {
    memory.delete(key);
  }
}
