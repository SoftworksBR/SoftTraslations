import {
  createContext,
  useContext,
  useState,
  ReactNode,
} from 'react';

import { tradutores, Tradutor } from '@/data/tradutores';

type TradutorContextType = {
  tradutorAtual: Tradutor | null;
  entrarComoTradutor: (id: number) => void;
  sair: () => void;
};

const TradutorContext =
  createContext<TradutorContextType | undefined>(
    undefined
  );

export function TradutorProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [tradutorAtual, setTradutorAtual] =
    useState<Tradutor | null>(null);

  function entrarComoTradutor(id: number) {
    const tradutor = tradutores.find(
      (item) => item.id === id
    );

    setTradutorAtual(tradutor ?? null);
  }

  function sair() {
    setTradutorAtual(null);
  }

  return (
    <TradutorContext.Provider
      value={{
        tradutorAtual,
        entrarComoTradutor,
        sair,
      }}
    >
      {children}
    </TradutorContext.Provider>
  );
}

export function useTradutor() {
  const context = useContext(TradutorContext);

  if (!context) {
    throw new Error(
      'useTradutor precisa estar dentro de TradutorProvider'
    );
  }

  return context;
}