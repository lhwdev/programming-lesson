import { BlockNoteEditor, BlockSchema, InlineContentSchema, Props, PropSchema, StyleSchema } from "@blocknote/core";
import { InputRule, KeyboardShortcutCommand } from "@tiptap/core";
import { Node, NodeType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface CustomNodeCommonConfig {
  type: string;
  propSchema: PropSchema;
}

export interface ReactCommonNode<T extends CustomNodeCommonConfig> {
  readonly type: T["type"];
  props: Readonly<Props<T["propSchema"]>>;
  _pmNode: Node;
  pos: number;

  update(node: { props?: Props<T["propSchema"]> }): void;
  remove(): void;
}

export interface ReactNodeInfo {
  type: NodeType;
}

export interface ReactCommonImplementation<
  T extends CustomNodeCommonConfig,
  _Node extends ReactCommonNode<T>,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> {
  globalKeyboardShortcuts?: (info: ReactNodeInfo) => ({
    [keySet: string]: (editor: BlockNoteEditor<B, I, S>) => boolean;
  });

  inputRules?: (info: ReactNodeInfo) => InputRule[];

  handlePaste?: (editor: BlockNoteEditor<B, I, S>, event: ClipboardEvent) => boolean;

  proseMirrorPlugins?: (info: ReactNodeInfo) => Plugin[];

  // keyboardShortcuts?: {
  //   [keySet: string]: (node: Node) => boolean;
  // };
}

export const ReactNodeCommonHelper = {
  addKeyboardShortcuts(
    info: ReactNodeInfo,
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
    for(const [keySet, fn] of Object.entries(impl.globalKeyboardShortcuts?.(info) ?? {})) {
      setHandler(keySet, () => fn(editor));
    }
    // Priority 2
    for(const [keySet, fn] of Object.entries(overrides)) {
      setHandler(keySet, fn);
    }

    return Object.fromEntries(result.entries());
  },

  addProseMirrorPlugins(
    editor: BlockNoteEditor,
    info: { type: NodeType },
    impl: ReactCommonImplementation<any, any, any, any, any>,
  ) {
    return [
      new Plugin({
        key: new PluginKey(`${info.type.name}-ReactNodeCommonHelper`),
        props: {
          handlePaste(_, event) {
            if(impl.handlePaste) {
              return impl.handlePaste(editor, event);
            }
            return false;
          },
        },
      }),
      ...impl.proseMirrorPlugins?.(info) ?? [],
    ];
  },
};
