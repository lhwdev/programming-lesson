import { BlockNoteEditor, BlockSchema, InlineContentSchema, Props, PropSchema, StyleSchema } from "@blocknote/core";
import { KeyboardShortcutCommand } from "@tiptap/core";

export interface CustomNodeCommonConfig {
  type: string;
  propSchema: PropSchema;
}

export interface ReactCommonNode<T extends CustomNodeCommonConfig> {
  readonly type: T["type"];
  props: Readonly<Props<T["propSchema"]>>;

  remove(): void;
}

export interface ReactCommonImplementation<
  T extends CustomNodeCommonConfig,
  Node extends ReactCommonNode<T>,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> {
  globalKeyboardShortcuts?: {
    [keySet: string]: (editor: BlockNoteEditor<B, I, S>) => boolean;
  };

  keyboardShortcuts?: {
    [keySet: string]: (node: Node) => boolean;
  };
}

export const ReactNodeCommonHelper = {
  addKeyboardShortcuts(
    editor: BlockNoteEditor,
    impl: ReactCommonImplementation<any, any, any, any, any>,
    overrides: Record<string, KeyboardShortcutCommand>,
  ) {
    const result = new Map<string, KeyboardShortcutCommand>();
    const setHandler = (keySet: string, action: KeyboardShortcutCommand) => {
      let fn = result.get(keySet);
      if(fn) {
        fn = (props) => action(props) || fn!(props);
      } else {
        fn = action;
      }
      result.set(keySet, fn);
    };
    // Priority 1
    for(const [keySet, fn] of Object.entries(impl.globalKeyboardShortcuts ?? {})) {
      setHandler(keySet, () => fn(editor));
    }
    // Priority 2
    for(const [keySet, fn] of Object.entries(impl.keyboardShortcuts ?? {})) {
      throw Error("not supported yet!");
    }
    // Priority 3
    for(const [keySet, fn] of Object.entries(overrides)) {
      setHandler(keySet, fn);
    }

    return Object.fromEntries(result.entries());
  },
};
