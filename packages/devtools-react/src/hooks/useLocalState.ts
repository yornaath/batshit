import React, { useEffect, useMemo } from "react";

export const useLocalState = <T>(
  key: string,
  defaultValue?: T
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const hasPersistedState = useMemo(() => {
    return globalThis.localStorage?.getItem(key) !== null;
  }, []);

  const persistedState = useMemo(() => {
    return hasPersistedState
      ? JSON.parse(globalThis.localStorage?.getItem(key) as string)
      : null;
  }, []);

  const [value, setValue] = React.useState<T>(
    hasPersistedState ? persistedState : defaultValue ?? false
  );

  useEffect(() => {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  }, [value]);

  return [value, setValue];
};
