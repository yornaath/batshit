import React, { useEffect } from "react";

const hasLocalOpenState =
  globalThis.localStorage?.getItem("batshit-devtools-open") !== null;

const localOpenState = hasLocalOpenState
  ? JSON.parse(
      globalThis.localStorage?.getItem("batshit-devtools-open") as string
    )
  : null;

export const useOpenState = (
  defaultOpen?: boolean
): [boolean, React.Dispatch<React.SetStateAction<boolean>>] => {
  const [open, setOpen] = React.useState<boolean>(
    hasLocalOpenState ? localOpenState : defaultOpen ?? false
  );

  useEffect(() => {
    globalThis.localStorage?.setItem("batshit-devtools-open", open.toString());
  }, [open]);

  return [open, setOpen];
};
