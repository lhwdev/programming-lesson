import {
  addInlineContentAttributes,
  addInlineContentKeyboardShortcuts,
  BlockNoteEditor,
  BlockNoteSchema,
  BlockSchema,
  camelToDataKebab,
  createInternalInlineContentSpec,
  createStronglyTypedTiptapNode,
  CustomInlineContentConfig,
  DefaultBlockSchema,
  getInlineContentParseRules,
  InlineContentFromConfig,
  InlineContentSchema,
  inlineContentToNodes,
  nodeToCustomInlineContent,
  PartialCustomInlineContentFromConfig,
  PartialInlineContent,
  Props,
  PropSchema,
  propsToAttributes,
  StyleSchema,
} from "@blocknote/core";
import {
  KeyboardShortcutCommand,
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { Slice } from "@tiptap/pm/model";
// import { useReactNodeView } from "@tiptap/react/dist/packages/react/src/useReactNodeView";
import { FC, useMemo } from "react";
import { renderToDOMSpec } from "./@util/ReactRenderUtil";
import { useUpdated } from "../util/useUpdated";
import { ReactCommonImplementation, ReactCommonNode, ReactNodeCommonHelper } from "./ReactNodeCommon";

export interface InlineContentNode<
  T extends CustomInlineContentConfig,
  I extends InlineContentSchema,
  S extends StyleSchema,
> extends ReactCommonNode<T> {
  // content: InlineContentNode<any, I, S>[];

  replace(newNode: PartialInlineContent<I, S>): void;
  remove(): void;
}

// extend BlockConfig but use a React render function
export interface ReactInlineContentImplementation<
  T extends CustomInlineContentConfig,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> extends ReactCommonImplementation<T, InlineContentNode<T, I, S>, B, I, S> {
  render: FC<{
    node: InlineContentNode<T, I, S>;
    inlineContent: InlineContentFromConfig<T, S>;
    updateInlineContent: (
      update: PartialCustomInlineContentFromConfig<T, S>
    ) => void;
    contentRef: (node: HTMLElement | null) => void;
  }>;
  // TODO?
  // toExternalHTML?: FC<{
  //   block: BlockFromConfig<T, I, S>;
  //   editor: BlockNoteEditor<BlockSchemaWithBlock<T["type"], T>, I, S>;
  // }>;
};

// Function that adds a wrapper with necessary classes and attributes to the
// component returned from a custom inline content's 'render' function, to
// ensure no data is lost on internal copy & paste.
export function InlineContentWrapper<
  IType extends string,
  PSchema extends PropSchema,
>(props: {
  children: JSX.Element;
  inlineContentType: IType;
  inlineContentProps: Props<PSchema>;
  propSchema: PSchema;
}) {
  return (
    // Creates inline content section element
    <NodeViewWrapper
      as="span"
      // Sets inline content section class
      className="bn-inline-content-section"
      // Sets content type attribute
      data-inline-content-type={props.inlineContentType}
      // Adds props as HTML attributes in kebab-case with "data-" prefix. Skips
      // props set to their default values.
      {...Object.fromEntries(
        Object.entries(props.inlineContentProps)
          .filter(([prop, value]) => value !== props.propSchema[prop].default)
          .map(([prop, value]) => {
            return [camelToDataKebab(prop), value];
          }),
      )}
    >
      {props.children}
    </NodeViewWrapper>
  );
}

// A function to create custom block for API consumers
// we want to hide the tiptap node from API consumers and provide a simpler API surface instead
export function createReactInlineContentSpec<
  const T extends CustomInlineContentConfig,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
>(
  inlineContentConfig: T,
  impl: ReactInlineContentImplementation<T, B, I & { [Key in T["type"]]: T }, S>,
) {
  const node = createStronglyTypedTiptapNode({
    name: inlineContentConfig.type as T["type"],
    inline: true,
    group: "inline",
    selectable: inlineContentConfig.content === "styled",
    atom: inlineContentConfig.content === "none",
    content: (inlineContentConfig.content === "styled"
      ? "inline*"
      : "") as T["content"] extends "styled" ? "inline*" : "",

    addAttributes() {
      return propsToAttributes(inlineContentConfig.propSchema);
    },

    addKeyboardShortcuts() {
      return ReactNodeCommonHelper.addKeyboardShortcuts(
        this.options.editor,
        impl,
        addInlineContentKeyboardShortcuts(inlineContentConfig),
      );
    },

    parseHTML() {
      return getInlineContentParseRules(inlineContentConfig);
    },

    renderHTML({ node }) {
      const editor = this.options.editor as BlockNoteEditor<DefaultBlockSchema, I, S>;

      const ic = nodeToCustomInlineContent(
        node,
        editor.schema.inlineContentSchema,
        editor.schema.styleSchema,
      ) as any as InlineContentFromConfig<T, S>; // TODO: fix cast
      const Content = impl.render;
      const output = renderToDOMSpec(
        (refCB) => (
          <Content
            node={{
              type: ic.type,
              props: ic.props as any,
              replace(_) {},
              remove() {},
            }}
            inlineContent={ic}
            updateInlineContent={() => {
              // No-op
            }}
            contentRef={refCB}
          />
        ),
        editor,
      );

      return addInlineContentAttributes(
        output,
        inlineContentConfig.type,
        node.attrs as Props<T["propSchema"]>,
        inlineContentConfig.propSchema,
      );
    },

    // TODO: needed?
    addNodeView() {
      const editor = this.options.editor as BlockNoteEditor<DefaultBlockSchema, I, S>;
      return (props) =>
        ReactNodeViewRenderer(
          (props: NodeViewProps) => {
            // hacky, should export `useReactNodeView` from tiptap to get access to ref
            const ref = (NodeViewContent({}) as any).ref;
            const inlineContent = nodeToCustomInlineContent(
              props.node,
              editor.schema.inlineContentSchema,
              editor.schema.styleSchema,
            ) as any as InlineContentFromConfig<T, S>; // TODO: fix cast
            const backingState = useUpdated(inlineContent);
            const node: InlineContentNode<T, I, S> = useMemo(() => ({
              get type() { return backingState.type; },
              get props() { return backingState.props as any; },
              set props(updated) {
                this.replace([{ ...inlineContent, props: updated } as any]);
              },
              replace(newNode) {
                const newAsNode = inlineContentToNodes<I, S>(
                  newNode,
                  editor._tiptapEditor.schema,
                  editor.schema.styleSchema,
                );
                editor._tiptapEditor.view.dispatch(
                  editor._tiptapEditor.view.state.tr.replaceWith(
                    props.getPos(),
                    props.getPos() + props.node.nodeSize,
                    newAsNode,
                  ),
                );
              },
              remove() {
                editor._tiptapEditor.view.dispatch(
                  editor._tiptapEditor.view.state.tr.replace(
                    props.getPos(),
                    props.getPos() + props.node.nodeSize,
                    Slice.empty,
                  ),
                );
              },
            }), []);

            const Content = impl.render;
            return (
              <InlineContentWrapper
                inlineContentProps={props.node.attrs as Props<T["propSchema"]>}
                inlineContentType={inlineContentConfig.type}
                propSchema={inlineContentConfig.propSchema}
              >
                <Content
                  contentRef={ref}
                  node={node}
                  inlineContent={inlineContent}
                  updateInlineContent={(update) => {
                    const content = inlineContentToNodes(
                      [update],
                      editor._tiptapEditor.schema,
                      editor.schema.styleSchema,
                    );

                    editor._tiptapEditor.view.dispatch(
                      editor._tiptapEditor.view.state.tr.replaceWith(
                        props.getPos(),
                        props.getPos() + props.node.nodeSize,
                        content,
                      ),
                    );
                  }}
                />
              </InlineContentWrapper>
            );
          },
          {
            className: "bn-ic-react-node-view-renderer",
            as: "span",
            // contentDOMElementTag: "span", (requires tt upgrade)
          },
        )(props);
    },
  });

  return createInternalInlineContentSpec(inlineContentConfig, {
    node: node,
  } as any);
}
