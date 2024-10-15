import { BlockNoteEditor, BlockSchema, InlineContentSchema, Props, PropSchema, StyleSchema } from "@blocknote/core";
import { InputRule, KeyboardShortcutCommand } from "@tiptap/core";
import { MarkType, Node, NodeType } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface CustomNodeCommonConfig {
  type: string;
}

export interface CustomNodeCommonConfigWithProps extends CustomNodeCommonConfig {
  propSchema: PropSchema;
}

export interface ReactCommonNode<T extends CustomNodeCommonConfig> {
  readonly type: T["type"];
  _pmNode: Node;
  pos: number;

  update(node: unknown): void;

  remove(): void;
}

export interface ReactCommonNodeWithProps<T extends CustomNodeCommonConfigWithProps> extends ReactCommonNode<T> {
  props: Readonly<Props<T["propSchema"]>>;

  update(node: { props?: Props<T["propSchema"]> }): void;
}

export interface ReactNodeInfo {
  type: NodeType | MarkType;
}

export interface ReactCommonImplementation<
  T extends CustomNodeCommonConfig,
  _Node extends ReactCommonNode<T>,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
  NodeInfo extends ReactNodeInfo,
> {
  globalKeyboardShortcuts?: (info: NodeInfo) => ({
    [keySet: string]: (editor: BlockNoteEditor<B, I, S>) => boolean;
  });

  inputRules?: (info: NodeInfo) => InputRule[];

  handlePaste?: (editor: BlockNoteEditor<B, I, S>, event: ClipboardEvent) => boolean;

  proseMirrorPlugins?: (info: NodeInfo) => Plugin[];

  // keyboardShortcuts?: {
  //   [keySet: string]: (node: Node) => boolean;
  // };
}

export const ReactNodeCommonHelper = {
  addKeyboardShortcuts(
    info: ReactNodeInfo,
    editor: BlockNoteEditor,
    impl: ReactCommonImplementation<any, any, any, any, any, any>,
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
    info: { type: NodeType | MarkType },
    impl: ReactCommonImplementation<any, any, any, any, any, any>,
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
      ...impl.proseMirrorPlugins?.(info as any) ?? [],
    ];
  },
};
