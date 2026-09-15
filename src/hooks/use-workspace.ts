import { useEffect, useReducer } from "react";
import { loadWorkspace, saveWorkspace } from "../data/local-workspace";
import { SYNCED_STORAGE_EVENT } from "../data/synced-storage";
import { workspaceReducer } from "../domain/workspace";

export function useWorkspace() {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, () =>
    loadWorkspace(window.localStorage),
  );

  useEffect(() => {
    saveWorkspace(window.localStorage, workspace);
    window.dispatchEvent(new Event(SYNCED_STORAGE_EVENT));
  }, [workspace]);

  return { workspace, dispatch };
}
