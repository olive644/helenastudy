import { useEffect, useReducer } from "react";
import { loadWorkspace, saveWorkspace } from "../data/local-workspace";
import { workspaceReducer } from "../domain/workspace";

export function useWorkspace() {
  const [workspace, dispatch] = useReducer(workspaceReducer, undefined, () =>
    loadWorkspace(window.localStorage),
  );

  useEffect(() => {
    saveWorkspace(window.localStorage, workspace);
  }, [workspace]);

  return { workspace, dispatch };
}
