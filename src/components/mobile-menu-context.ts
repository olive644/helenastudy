import { createContext, type Dispatch, type SetStateAction } from "react";

export const MobileMenuContext = createContext<{
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}>({ open: false, setOpen: () => {} });
