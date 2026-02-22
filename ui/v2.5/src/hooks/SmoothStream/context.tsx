import React, { useCallback, useEffect, useMemo, useState } from "react";

export type SmoothStreamMode = "video" | "marker";

interface SmoothStreamState {
  enabled: boolean;
  mode: SmoothStreamMode;
  randomEnabled: boolean;
}

interface SmoothStreamContextValue extends SmoothStreamState {
  enterMode: () => void;
  exitMode: () => void;
  setMode: (mode: SmoothStreamMode) => void;
  setRandomEnabled: (enabled: boolean) => void;
}

const STORAGE_KEY = "stash.smoothStream.v1";
const DEFAULT_STATE: SmoothStreamState = {
  enabled: false,
  mode: "video",
  randomEnabled: false,
};

export const SmoothStreamContext =
  React.createContext<SmoothStreamContextValue | null>(null);

function parseStoredState(raw: string | null): SmoothStreamState {
  if (!raw) {
    return DEFAULT_STATE;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SmoothStreamState>;
    return {
      enabled: parsed.enabled === true,
      mode: parsed.mode === "marker" ? "marker" : "video",
      randomEnabled: parsed.randomEnabled === true,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function useSmoothStreamContext() {
  const context = React.useContext(SmoothStreamContext);
  if (!context) {
    throw new Error(
      "useSmoothStreamContext must be used within a SmoothStreamProvider"
    );
  }
  return context;
}

export const SmoothStreamProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<SmoothStreamState>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_STATE;
    }
    return parseStoredState(window.localStorage.getItem(STORAGE_KEY));
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const enterMode = useCallback(() => {
    setState((current) => ({ ...current, enabled: true }));
  }, []);

  const exitMode = useCallback(() => {
    setState((current) => ({ ...current, enabled: false }));
  }, []);

  const setMode = useCallback((mode: SmoothStreamMode) => {
    setState((current) => ({ ...current, mode, enabled: true }));
  }, []);

  const setRandomEnabled = useCallback((enabled: boolean) => {
    setState((current) => ({ ...current, randomEnabled: enabled }));
  }, []);

  const value = useMemo<SmoothStreamContextValue>(
    () => ({
      ...state,
      enterMode,
      exitMode,
      setMode,
      setRandomEnabled,
    }),
    [state, enterMode, exitMode, setMode, setRandomEnabled]
  );

  return (
    <SmoothStreamContext.Provider value={value}>
      {children}
    </SmoothStreamContext.Provider>
  );
};
