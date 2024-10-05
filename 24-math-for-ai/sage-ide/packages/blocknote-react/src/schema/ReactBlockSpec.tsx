import {
  applyNonSelectableBlockFix,
  BlockNoteEditor,
  BlockSchema,
  BlockSchemaWithBlock,
  camelToDataKebab,
  createInternalBlockSpec,
  createStronglyTypedTiptapNode,
  CustomBlockConfig,
  getBlockFromPos,
  getParseRules,
  inheritedProps,
  InlineContent,
  InlineContentSchema,
  mergeCSSClasses,
  PartialBlock,
  PartialBlockFromConfig,
  Props,
  PropSchema,
  propsToAttributes,
  SpecificBlock,
  StyleSchema,
  TableContent,
} from "@blocknote/core";
import {
  NodeView,
  NodeViewContent,
  NodeViewProps,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import { FC, ReactNode, useMemo } from "react";
import { renderToDOMSpec } from "./@util/ReactRenderUtil";
import { ReactCommonImplementation, ReactCommonNode } from "./ReactNodeCommon";
import { useUpdated } from "../util/useUpdated";
import "../types/BlockContainer";

// this file is mostly analogoues to `customBlocks.ts`, but for React blocks

export interface BlockNode<
  T extends CustomBlockConfig,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> extends ReactCommonNode<T> {
  data: SpecificBlock<B & BlockSchemaWithBlock<T["type"], T>, T["type"], I, S>;
  readonly id: string;
  content: T["content"] extends "inline" ? InlineContent<I, S>[] : T["content"] extends "table" ? TableContent<I, S> : T["content"] extends "none" ? undefined : never;

  update(block: PartialBlock<B, I, S>): void;
  replace(newNode: PartialBlock<B, I, S>): void;
}

export type ReactCustomBlockRenderProps<
  T extends CustomBlockConfig,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> = {
  block: BlockNode<T, B, I, S>;
  editor: BlockNoteEditor<BlockSchemaWithBlock<T["type"], T>, I, S>;
  contentRef: (node: HTMLElement | null) => void;
};

// extend BlockConfig but use a React render function
export interface ReactCustomBlockImplementation<
  T extends CustomBlockConfig,
  B extends BlockSchema,
  I extends InlineContentSchema,
  S extends StyleSchema,
> extends ReactCommonImplementation<T, BlockNode<T, B, I, S>, B, I, S> {
  render: FC<ReactCustomBlockRenderProps<T, B, I, S>>;
  toExternalHTML?: FC<ReactCustomBlockRenderProps<T, B, I, S>>;
  parse?: (
    el: HTMLElement
  ) => PartialBlockFromConfig<T, I, S>["props"] | undefined;
};

// Function that wraps the React component returned from 'blockConfig.render' in
// a `NodeViewWrapper` which also acts as a `blockContent` div. It contains the
// block type and props as HTML attributes.
export function BlockContentWrapper<
  BType extends string,
  PSchema extends PropSchema,
>(props: {
  blockType: BType;
  blockProps: Props<PSchema>;
  propSchema: PSchema;
  isFileBlock?: boolean;
  domAttributes?: Record<string, string>;
  children: ReactNode;
}) {
  return (
    // Creates `blockContent` element
    <NodeViewWrapper
      // Adds custom HTML attributes
      {...Object.fromEntries(
        Object.entries(props.domAttributes || {}).filter(
          ([key]) => key !== "class",
        ),
      )}
      // Sets blockContent class
      className={mergeCSSClasses(
        "bn-block-content",
        props.domAttributes?.class || "",
      )}
      // Sets content type attribute
      data-content-type={props.blockType}
      // Adds props as HTML attributes in kebab-case with "data-" prefix. Skips
      // props which are already added as HTML attributes to the parent
      // `blockContent` element (inheritedProps) and props set to their default
      // values
      {...Object.fromEntries(
        Object.entries(props.blockProps)
          .filter(
            ([prop, value]) =>
              !inheritedProps.includes(prop)
              && value !== props.propSchema[prop].default,
          )
          .map(([prop, value]) => {
            return [camelToDataKebab(prop), value];
          }),
      )}
      data-file-block={props.isFileBlock === true || undefined}
    >
      {props.children}
    </NodeViewWrapper>
  );
}

interface ExtendedConfig {
  code?: boolean;
}

// A function to create custom block for API consumers
// we want to hide the tiptap node from API consumers and provide a simpler API surface instead
export function createReactBlockSpec<
  const T extends CustomBlockConfig & ExtendedConfig,
  const B extends BlockSchema,
  const I extends InlineContentSchema,
  const S extends StyleSchema,
>(
  blockConfig: T,
  blockImplementation: ReactCustomBlockImplementation<T, B & BlockSchemaWithBlock<T["type"], T>, I, S>,
) {
  const node = createStronglyTypedTiptapNode({
    name: blockConfig.type as T["type"],
    content: (blockConfig.content === "inline"
      ? "inline*"
      : "") as T["content"] extends "inline" ? "inline*" : "",
    group: "blockContent",
    selectable: blockConfig.isSelectable ?? true,

    code: blockConfig.code,

    addAttributes() {
      return propsToAttributes(blockConfig.propSchema);
    },

    parseHTML() {
      return getParseRules(blockConfig, blockImplementation.parse);
    },

    renderHTML() {
      // renderHTML is not really used, as we always use a nodeView, and we use toExternalHTML / toInternalHTML for serialization
      // There's an edge case when this gets called nevertheless; before the nodeviews have been mounted
      // this is why we implement it with a temporary placeholder
      const div = document.createElement("div");
      div.setAttribute("data-tmp-placeholder", "true");
      return {
        dom: div,
      };
    },

    addNodeView() {
      return (props) => {
        const nodeView = ReactNodeViewRenderer(
          (props: NodeViewProps) => {
            // Gets the BlockNote editor instance
            const editor = this.options.editor! as BlockNoteEditor<BlockSchemaWithBlock<T["type"], T>, I, S>;
            // Gets the block
            const block = getBlockFromPos(
              props.getPos,
              editor,
              this.editor,
              blockConfig.type,
            );
            const updatedBlock = useUpdated(block);
            const node = useMemo<BlockNode<T, B & BlockSchemaWithBlock<T["type"], T>, I, S>>(() => ({
              get data() { return updatedBlock.$current; },
              get type() { return updatedBlock.type; },
              get id() { return updatedBlock.id; },
              get props() { return updatedBlock.props; },
              set props(newProps) {
                this.update({ props: newProps });
              },
              get content() { return updatedBlock.content; },
              set content(newContent) {
                this.update({ content: newContent });
              },
              update(block) {
                editor._tiptapEditor.commands.BNUpdateBlock(props.getPos(), block);
              },
              replace(newNode) {
                this.update(newNode);
              },
              remove() {
                editor._tiptapEditor.commands.BNDeleteBlock(props.getPos());
              },
            }), []);
            // Gets the custom HTML attributes for `blockContent` nodes
            const blockContentDOMAttributes
              = this.options.domAttributes?.blockContent || {};

            // hacky, should export `useReactNodeView` from tiptap to get access to ref
            const ref = (NodeViewContent({}) as any).ref;

            const BlockContent = blockImplementation.render;
            return (
              <BlockContentWrapper
                blockType={block.type}
                blockProps={block.props}
                propSchema={blockConfig.propSchema}
                isFileBlock={blockConfig.isFileBlock}
                domAttributes={blockContentDOMAttributes}
              >
                <BlockContent
                  block={node}
                  editor={editor}
                  contentRef={ref}
                />
              </BlockContentWrapper>
            );
          },
          {
            className: "bn-react-node-view-renderer",
          },
        )(props) as NodeView<any>;

        if(blockConfig.isSelectable === false) {
          applyNonSelectableBlockFix(nodeView, this.editor);
        }

        return nodeView;
      };
    },
  });

  return createInternalBlockSpec(blockConfig, {
    node: node,
    toInternalHTML: (block, editor) => {
      const blockContentDOMAttributes
        = node.options.domAttributes?.blockContent || {};

      const BlockContent = blockImplementation.render;
      const output = renderToDOMSpec(
        (refCB) => (
          <BlockContentWrapper
            blockType={block.type}
            blockProps={block.props}
            propSchema={blockConfig.propSchema}
            domAttributes={blockContentDOMAttributes}
          >
            <BlockContent
              block={block as any}
              editor={editor as any}
              contentRef={refCB}
            />
          </BlockContentWrapper>
        ),
        editor,
      );
      output.contentDOM?.setAttribute("data-editable", "");

      return output;
    },
    toExternalHTML: (block, editor) => {
      const blockContentDOMAttributes
        = node.options.domAttributes?.blockContent || {};

      const BlockContent
        = blockImplementation.toExternalHTML || blockImplementation.render;
      const output = renderToDOMSpec((refCB) => {
        return (
          <BlockContentWrapper
            blockType={block.type}
            blockProps={block.props}
            propSchema={blockConfig.propSchema}
            domAttributes={blockContentDOMAttributes}
          >
            <BlockContent
              block={block as any}
              editor={editor as any}
              contentRef={refCB}
            />
          </BlockContentWrapper>
        );
      }, editor);
      output.contentDOM?.setAttribute("data-editable", "");

      return output;
    },
  });
}
