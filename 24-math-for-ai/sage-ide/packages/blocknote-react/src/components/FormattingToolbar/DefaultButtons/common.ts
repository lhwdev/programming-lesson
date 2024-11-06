import { useMemo, useState } from "react";
import { useEditorContentOrSelectionChange } from "../../../hooks/useEditorContentOrSelectionChange";
import { Selection } from "@tiptap/pm/state";
import { useBlockNoteEditor } from "../../../hooks/useBlockNoteEditor";
import { useEditorSelectionChange } from "../../../hooks/useEditorSelectionChange";

function useEditorDerivedState<T>(calculate: (previous?: T) => T, useFn = useEditorContentOrSelectionChange): T {
  const [state, setState] = useState(calculate);
  useFn(() => setState(calculate));
  return state;
}

export function useSelection(): Selection {
  const editor = useBlockNoteEditor();
  return useEditorDerivedState(() => {
    return editor._tiptapEditor.state.selection;
  }, useEditorSelectionChange);
}

export function useIsStyleApplicable() {
  const selection = useSelection();

  return useMemo(() => {
    return selection.$from.doc.cut(selection.from, selection.to).textContent.length !== 0;
  }, [selection]);
}
