import { Extension, Node } from "@tiptap/core";
import { Fragment, NodeType, Node as PMNode, ResolvedPos, Schema, Slice } from "prosemirror-model";
import { NodeSelection, TextSelection } from "prosemirror-state";

import { getBlockInfoFromPos } from "../api/getBlockInfoFromPos";
import {
  blockToNode,
  inlineContentToNodes,
  tableContentToNodes,
} from "../api/nodeConversions/nodeConversions";
import { PartialBlock } from "../blocks/defaultBlocks";
import type { BlockNoteEditor } from "../editor/BlockNoteEditor";
import { NonEditableBlockPlugin } from "../extensions/NonEditableBlocks/NonEditableBlockPlugin";
import {
  BlockNoteDOMAttributes,
  BlockSchema,
  InlineContentSchema,
  StyleSchema,
} from "../schema";
import { mergeCSSClasses } from "../util/browser";
import { UnreachableCaseError } from "../util/typescript";

// Object containing all possible block attributes.
const BlockAttributes: Record<string, string> = {
  blockColor: "data-block-color",
  blockStyle: "data-block-style",
  id: "data-id",
  depth: "data-depth",
  depthChange: "data-depth-change",
};

declare module "prosemirror-model" {
  interface NodeSpec {
    blockExtra?: BlockExtra;
  }
}

declare module "@tiptap/core" {
  interface NodeConfig {
    blockExtra?: BlockExtra;
  }

  interface Commands<ReturnType> {
    block: {
      BNCreateBlock: (pos: number) => ReturnType;
      BNDeleteBlock: (posInBlock: number) => ReturnType;
      BNMergeBlocks: (posBetweenBlocks: number) => ReturnType;
      BNSplitBlock: (
        posInBlock: number,
        keepType?: boolean,
        keepProps?: boolean
      ) => ReturnType;
      BNUpdateBlock: <
        BSchema extends BlockSchema,
        I extends InlineContentSchema,
        S extends StyleSchema,
      >(
        posInBlock: number,
        block: PartialBlock<BSchema, I, S>
      ) => ReturnType;
      BNCreateOrUpdateBlock: <
        BSchema extends BlockSchema,
        I extends InlineContentSchema,
        S extends StyleSchema,
      >(
        posInBlock: number,
        block: PartialBlock<BSchema, I, S>
      ) => ReturnType;
    };
  }
}

/**
 * The main "Block node" documents consist of
 */
export const BlockContainer = Node.create<{
  domAttributes?: BlockNoteDOMAttributes;
  editor: BlockNoteEditor<any, any, any>;
}>({
  name: "blockContainer",
  group: "blockContainer",
  // A block always contains content, and optionally a blockGroup which contains nested blocks
  content: "blockContent anyBlockGroup?",
  // Ensures content-specific keyboard handlers trigger first.
  priority: 50,
  defining: true,

  parseHTML() {
    return [
      {
        tag: "div",
        getAttrs: (element) => {
          if(typeof element === "string") {
            return false;
          }

          const attrs: Record<string, any> = { selected: false };
          for(const [nodeAttr, HTMLAttr] of Object.entries(BlockAttributes)) {
            if(element.getAttribute(HTMLAttr)) {
              attrs[nodeAttr] = element.getAttribute(HTMLAttr)!;
            }
          }

          if(element.getAttribute("data-node-type") === "blockContainer") {
            return attrs;
          }

          return false;
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const blockOuter = document.createElement("div");
    blockOuter.className = "bn-block-outer";
    blockOuter.setAttribute("data-node-type", "blockOuter");
    for(const [attribute, value] of Object.entries(HTMLAttributes)) {
      if(attribute !== "class") {
        blockOuter.setAttribute(attribute, value);
      }
    }

    const blockHTMLAttributes = {
      ...(this.options.domAttributes?.block || {}),
      ...HTMLAttributes,
    };
    const block = document.createElement("div");
    block.className = mergeCSSClasses("bn-block", blockHTMLAttributes.class);
    block.setAttribute("data-node-type", this.name);
    for(const [attribute, value] of Object.entries(blockHTMLAttributes)) {
      if(attribute !== "class") {
        block.setAttribute(attribute, value);
      }
    }

    blockOuter.appendChild(block);

    return {
      dom: blockOuter,
      contentDOM: block,
    };
  },

  addCommands() {
    return {
      // Creates a new text block at a given position.
      BNCreateBlock:
        (pos) =>
          ({ state, dispatch }) => {
            const newBlock
            = state.schema.nodes["blockContainer"].createAndFill()!;

            if(dispatch) {
              state.tr.insert(pos, newBlock).scrollIntoView();
            }

            return true;
          },
      // Deletes a block at a given position.
      BNDeleteBlock:
        (posInBlock) =>
          ({ state, dispatch }) => {
            const blockInfo = getBlockInfoFromPos(state.doc, posInBlock);
            if(!blockInfo) {
              return false;
            }

            const { startPos, endPos } = blockInfo;

            if(dispatch) {
              state.tr.deleteRange(startPos, endPos);
            }

            return true;
          },
      // Updates a block at a given position.
      BNUpdateBlock:
        (posInBlock, block) =>
          ({ state, dispatch }) => {
            const blockInfo = getBlockInfoFromPos(state.doc, posInBlock);
            if(!blockInfo) {
              return false;
            }

            const { startPos, endPos, node, contentNode } = blockInfo;
            const blockConfig = this.options.editor.schema.blockSpecs[contentNode.type.name].config;

            if(dispatch) {
            // Adds blockGroup node with child blocks if necessary.

              if(block.children !== undefined || blockConfig.blockContent) {
                const childNodes = [];

                // Creates ProseMirror nodes for each child block, including their descendants.
                if(block.children) {
                  for(const child of block.children) {
                    childNodes.push(
                      blockToNode(
                        child,
                        state.schema,
                        this.options.editor.schema.styleSchema,
                      ),
                    );
                  }
                } else {
                  childNodes.push(state.schema.nodes.paragraph.create());
                }

                // Checks if a blockGroup node already exists.
                if(node.childCount === 2) {
                // Replaces all child nodes in the existing blockGroup with the ones created earlier.
                  state.tr.replace(
                    startPos + contentNode.nodeSize + 1,
                    endPos - 1,
                    new Slice(Fragment.from(childNodes), 0, 0),
                  );
                } else {
                  // Inserts a new blockGroup containing the child nodes created earlier.
                  state.tr.insert(startPos + contentNode.nodeSize, createBlockGroup(state.schema, contentNode.type, childNodes));
                }
              }

              const oldType = contentNode.type.name;
              const newType = block.type || oldType;

              // The code below determines the new content of the block.
              // or "keep" to keep as-is
              let content: PMNode[] | "keep" = "keep";

              // Has there been any custom content provided?
              if(block.content) {
                if(typeof block.content === "string") {
                // Adds a single text node with no marks to the content.
                  content = inlineContentToNodes(
                    [block.content],
                    state.schema,
                    this.options.editor.schema.styleSchema,
                  );
                } else if(Array.isArray(block.content)) {
                // Adds a text node with the provided styles converted into marks to the content,
                // for each InlineContent object.
                  content = inlineContentToNodes(
                    block.content,
                    state.schema,
                    this.options.editor.schema.styleSchema,
                  );
                } else if(block.content.type === "tableContent") {
                  content = tableContentToNodes(
                    block.content,
                    state.schema,
                    this.options.editor.schema.styleSchema,
                  );
                } else {
                  throw new UnreachableCaseError(block.content.type);
                }
              } else {
              // no custom content has been provided, use existing content IF possible

                // Since some block types contain inline content and others don't,
                // we either need to call setNodeMarkup to just update type &
                // attributes, or replaceWith to replace the whole blockContent.
                const oldContentType = state.schema.nodes[oldType].spec.content;
                const newContentType = state.schema.nodes[newType].spec.content;

                if(oldContentType === "") {
                // keep old content, because it's empty anyway and should be compatible with
                // any newContentType
                } else if(newContentType !== oldContentType) {
                // the content type changed, replace the previous content
                  content = [];
                } else {
                // keep old content, because the content type is the same and should be compatible
                }
              }

              // Now, changes the blockContent node type and adds the provided props
              // as attributes. Also preserves all existing attributes that are
              // compatible with the new type.
              //
              // Use either setNodeMarkup or replaceWith depending on whether the
              // content is being replaced or not.
              if(content === "keep") {
              // use setNodeMarkup to only update the type and attributes
                state.tr.setNodeMarkup(
                  startPos,
                  block.type === undefined
                    ? undefined
                    : state.schema.nodes[block.type],
                  {
                    ...contentNode.attrs,
                    ...block.props,
                  },
                );
              } else {
                // use replaceWith to replace the content and the block itself
                // also  reset the selection since replacing the block content
                // sets it to the next block.
                state.tr
                  .replaceWith(
                    startPos,
                    endPos,
                    state.schema.nodes[newType].create(
                      {
                        ...contentNode.attrs,
                        ...block.props,
                      },
                      content,
                    ),
                  )
                // If the node doesn't contain editable content, we want to
                // select the whole node. But if it does have editable content,
                // we want to set the selection to the start of it.
                  .setSelection(
                    state.schema.nodes[newType].spec.content === ""
                      ? new NodeSelection(state.tr.doc.resolve(startPos))
                      : state.schema.nodes[newType].spec.content === "tableRow+"
                        // Need to offset the position as we have to get through the
                        // `tableRow` and `tableCell` nodes to get to the
                        // `tableParagraph` node we want to set the selection in.
                        ? new TextSelection(state.tr.doc.resolve(startPos + 4))
                        : new TextSelection(state.tr.doc.resolve(startPos)),

                  );
              }

              // Adds all provided props as attributes to the parent blockContainer node too, and also preserves existing
              // attributes.
              state.tr.setNodeMarkup(startPos - 1, undefined, {
                ...node.attrs,
                ...block.props,
              });
            }

            return true;
          },
      // Appends the text contents of a block to the nearest previous block, given a position between them. Children of
      // the merged block are moved out of it first, rather than also being merged.
      //
      // In the example below, the position passed into the function is between Block1 and Block2.
      //
      // Block1
      //    Block2
      // Block3
      //    Block4
      //        Block5
      //
      // Becomes:
      //
      // Block1
      //    Block2Block3
      // Block4
      //     Block5
      BNMergeBlocks:
        (posBetweenBlocks) =>
          ({ state, dispatch }) => {
            const nextNodeIsBlock
            = state.doc.resolve(posBetweenBlocks + 1).node().type.name
            === "blockContainer";
            const prevNodeIsBlock
            = state.doc.resolve(posBetweenBlocks - 1).node().type.name
            === "blockContainer";

            if(!nextNodeIsBlock || !prevNodeIsBlock) {
              return false;
            }

            const nextBlockInfo = getBlockInfoFromPos(
              state.doc,
              posBetweenBlocks + 1,
            )!;

            const { node, contentNode, startPos, endPos, depth } = nextBlockInfo;

            // Removes a level of nesting all children of the next block by 1 level, if it contains both content and block
            // group nodes.
            if(node.childCount === 2) {
              const childBlocksStart = state.doc.resolve(
                startPos + contentNode.nodeSize + 1,
              );
              const childBlocksEnd = state.doc.resolve(endPos - 1);
              const childBlocksRange
              = childBlocksStart.blockRange(childBlocksEnd);

              // Moves the block group node inside the block into the block group node that the current block is in.
              if(dispatch) {
                state.tr.lift(childBlocksRange!, depth - 1);
              }
            }

            let prevBlockEndPos = posBetweenBlocks - 1;
            let prevBlockInfo = getBlockInfoFromPos(state.doc, prevBlockEndPos);

            // Finds the nearest previous block, regardless of nesting level.
            while(prevBlockInfo!.numChildBlocks > 0) {
              prevBlockEndPos--;
              prevBlockInfo = getBlockInfoFromPos(state.doc, prevBlockEndPos);
              if(!prevBlockInfo) {
                return false;
              }
            }

            // Deletes next block and adds its text content to the nearest previous block.

            if(dispatch) {
              dispatch(
                state.tr
                  .deleteRange(startPos, startPos + contentNode.nodeSize)
                  .replace(
                    prevBlockEndPos - 1,
                    startPos,
                    new Slice(contentNode.content, 0, 0),
                  )
                  .scrollIntoView(),
              );

              state.tr.setSelection(
                new TextSelection(state.doc.resolve(prevBlockEndPos - 1)),
              );
            }

            return true;
          },
      // Splits a block at a given position. Content after the position is moved to a new block below, at the same
      // nesting level.
      // - `keepType` is usually false, unless the selection is at the start of
      // a block.
      // - `keepProps` is usually true when `keepType` is true, except for when
      // creating new list item blocks with Enter.
      BNSplitBlock:
        (posInBlock, keepType, keepProps) =>
          ({ state, dispatch }) => {
            const blockInfo = getBlockInfoFromPos(state.doc, posInBlock);
            if(!blockInfo) {
              return false;
            }

            const { contentNode, contentType, startPos, endPos, depth } = blockInfo;

            const originalBlockContent = state.doc.cut(startPos + 1, posInBlock);
            const newBlockContent = state.doc.cut(posInBlock, endPos - 1);

            const newBlock
            = state.schema.nodes["blockContainer"].createAndFill()!;

            const newBlockInsertionPos = endPos + 1;
            const newBlockContentPos = newBlockInsertionPos + 2;

            if(dispatch) {
            // Creates a new block. Since the schema requires it to have a content node, a paragraph node is created
            // automatically, spanning newBlockContentPos to newBlockContentPos + 1.
              state.tr.insert(newBlockInsertionPos, newBlock);

              // Replaces the content of the newly created block's content node. Doesn't replace the whole content node so
              // its type doesn't change.
              state.tr.replace(
                newBlockContentPos,
                newBlockContentPos + 1,
                newBlockContent.content.size > 0
                  ? new Slice(
                    Fragment.from(newBlockContent),
                    depth + 2,
                    depth + 2,
                  )
                  : undefined,
              );

              // Changes the type of the content node. The range doesn't matter as long as both from and to positions are
              // within the content node.
              if(keepType) {
                state.tr.setBlockType(
                  newBlockContentPos,
                  newBlockContentPos,
                  state.schema.node(contentType).type,
                  keepProps ? contentNode.attrs : undefined,
                );
              }

              // Sets the selection to the start of the new block's content node.
              state.tr.setSelection(
                new TextSelection(state.doc.resolve(newBlockContentPos)),
              );

              // Replaces the content of the original block's content node. Doesn't replace the whole content node so its
              // type doesn't change.
              state.tr.replace(
                startPos + 1,
                endPos - 1,
                originalBlockContent.content.size > 0
                  ? new Slice(
                    Fragment.from(originalBlockContent),
                    depth + 2,
                    depth + 2,
                  )
                  : undefined,
              );

              state.tr.scrollIntoView();
            }

            return true;
          },
    };
  },

  addExtensions() {
    const PreserveBlockExtraSpec = Extension.create({
      name: "PreserveBlockExtraSpec",
      extendNodeSchema(extension) {
        const extra = extension.config.blockExtra;
        if(extra) return { blockExtra: extra };
        return {};
      },
    });
    return [PreserveBlockExtraSpec];
  },

  addProseMirrorPlugins() {
    return [NonEditableBlockPlugin()];
  },

  addKeyboardShortcuts() {
    // handleBackspace is partially adapted from https://github.com/ueberdosis/tiptap/blob/ed56337470efb4fd277128ab7ef792b37cfae992/packages/core/src/extensions/keymap.ts
    const handleBackspace = () =>
      this.editor.commands.first(({ commands }) => [
        // Deletes the selection if it's not empty.
        () => commands.deleteSelection(),
        // Undoes an input rule if one was triggered in the last editor state change.
        () => commands.undoInputRule(),
        // Reverts block content type to a paragraph if the selection is at the start of the block.
        () =>
          commands.command(({ state }) => {
            const blockInfo = getBlockInfoFromPos(
              state.doc,
              state.selection.from,
            );
            if(!blockInfo) return false;
            const { contentType, startPos } = blockInfo;

            const selectionAtBlockStart = state.selection.from === startPos + 1;
            const isParagraph = contentType.name === "paragraph";

            if(selectionAtBlockStart && !isParagraph) {
              return commands.BNUpdateBlock(state.selection.from, {
                type: "paragraph",
                props: {},
              });
            }

            return false;
          }),
        // Removes a level of nesting if the block is indented if the selection is at the start of the block.
        () =>
          commands.command(({ state }) => {
            const blockInfo = getBlockInfoFromPos(
              state.doc,
              state.selection.from,
            );
            if(!blockInfo) return false;
            const { startPos } = blockInfo;

            const selectionAtBlockStart = state.selection.from === startPos + 1;

            if(selectionAtBlockStart) {
              return commands.BNLiftListItem();
            }

            return false;
          }),
        // Merges block with the previous one if it isn't indented, isn't the first block in the doc, and the selection
        // is at the start of the block.
        () =>
          commands.command(({ state }) => {
            const blockInfo = getBlockInfoFromPos(
              state.doc,
              state.selection.from,
            );
            if(!blockInfo) return false;
            const { depth, startPos } = blockInfo;

            const selectionAtBlockStart = state.selection.from === startPos + 1;
            const selectionEmpty = state.selection.empty;
            const blockAtDocStart = startPos === 2;

            const posBetweenBlocks = startPos - 1;

            if(
              !blockAtDocStart
              && selectionAtBlockStart
              && selectionEmpty
              && depth === 2
            ) {
              return commands.BNMergeBlocks(posBetweenBlocks);
            }

            return false;
          }),
      ]);

    const handleDelete = () =>
      this.editor.commands.first(({ commands }) => [
        // Deletes the selection if it's not empty.
        () => commands.deleteSelection(),
        // Merges block with the next one (at the same nesting level or lower),
        // if one exists, the block has no children, and the selection is at the
        // end of the block.
        () =>
          commands.command(({ state }) => {
            const blockInfo = getBlockInfoFromPos(
              state.doc,
              state.selection.from,
            );
            if(!blockInfo) return false;
            const { node, depth, endPos } = blockInfo;

            const blockAtDocEnd = endPos === state.doc.nodeSize - 4;
            const selectionAtBlockEnd = state.selection.from === endPos - 1;
            const selectionEmpty = state.selection.empty;
            const hasChildBlocks = node.childCount === 2;

            if(
              !blockAtDocEnd
              && selectionAtBlockEnd
              && selectionEmpty
              && !hasChildBlocks
            ) {
              let oldDepth = depth;
              let newPos = endPos + 2;
              let newDepth = state.doc.resolve(newPos).depth;

              while(newDepth < oldDepth) {
                oldDepth = newDepth;
                newPos += 2;
                newDepth = state.doc.resolve(newPos).depth;
              }

              return commands.BNMergeBlocks(newPos - 1);
            }

            return false;
          }),
      ]);

    const handleEnter = () =>
      this.editor.commands.first(({ commands }) => [
        // Removes a level of nesting if the block is empty & indented, while the selection is also empty & at the start
        // of the block.
        () =>
          commands.command(({ state }) => {
            const blockInfo = getBlockInfoFromPos(
              state.doc,
              state.selection.from,
            );
            if(!blockInfo) return false;
            const { contentNode, depth } = blockInfo;

            const selectionAtBlockStart
              = state.selection.$anchor.parentOffset === 0;
            const selectionEmpty
              = state.selection.anchor === state.selection.head;
            const blockEmpty = contentNode.childCount === 0;
            const blockIndented = depth > 2;

            if(
              selectionAtBlockStart
              && selectionEmpty
              && blockEmpty
              && blockIndented
            ) {
              return commands.BNLiftListItem();
            }

            return false;
          }),
        // Creates a new block and moves the selection to it if the current one is empty, while the selection is also
        // empty & at the start of the block.
        () =>
          commands.command(({ state, chain }) => {
            const blockInfo = getBlockInfoFromPos(
              state.doc,
              state.selection.from,
            );
            if(!blockInfo) return false;
            const { contentNode, endPos } = blockInfo;

            const selectionAtBlockStart
              = state.selection.$anchor.parentOffset === 0;
            const selectionEmpty
              = state.selection.anchor === state.selection.head;
            const blockEmpty = contentNode.childCount === 0;

            if(selectionAtBlockStart && selectionEmpty && blockEmpty) {
              const newBlockInsertionPos = endPos + 1;
              const newBlockContentPos = newBlockInsertionPos + 2;

              chain()
                .BNCreateBlock(newBlockInsertionPos)
                .setTextSelection(newBlockContentPos)
                .run();

              return true;
            }

            return false;
          }),
        // Splits the current block, moving content inside that's after the cursor to a new text block below. Also
        // deletes the selection beforehand, if it's not empty.
        () =>
          commands.command(({ state, chain }) => {
            const blockInfo = getBlockInfoFromPos(
              state.doc,
              state.selection.from,
            );
            if(!blockInfo) return false;
            const { contentNode } = blockInfo;

            const selectionAtBlockStart
              = state.selection.$anchor.parentOffset === 0;
            const blockEmpty = contentNode.childCount === 0;

            if(!blockEmpty) {
              chain()
                .deleteSelection()
                .BNSplitBlock(
                  state.selection.from,
                  selectionAtBlockStart,
                  selectionAtBlockStart,
                )
                .run();

              return true;
            }

            return false;
          }),
      ]);

    return {
      "Backspace": handleBackspace,
      "Delete": handleDelete,
      "Enter": handleEnter,
      // Always returning true for tab key presses ensures they're not captured by the browser. Otherwise, they blur the
      // editor since the browser will try to use tab for keyboard navigation.
      "Tab": () => {
        if(
          this.options.editor.formattingToolbar?.shown
          || this.options.editor.linkToolbar?.shown
          || this.options.editor.filePanel?.shown
        ) {
          // don't handle tabs if a toolbar is shown, so we can tab into / out of it
          return false;
        }
        this.editor.commands.BNSinkListItem();
        return true;
      },
      "Shift-Tab": () => {
        if(
          this.options.editor.formattingToolbar?.shown
          || this.options.editor.linkToolbar?.shown
          || this.options.editor.filePanel?.shown
        ) {
          // don't handle tabs if a toolbar is shown, so we can tab into / out of it
          return false;
        }
        this.editor.commands.BNLiftListItem();
        return true;
      },
    };
  },
});

type Content = Fragment | PMNode[] | readonly PMNode[];

export interface BlockExtra {
  isBlock?: boolean;
  createBlockGroup?(schema: Schema, children: Fragment): PMNode;

  alien?: boolean;
  ignoreStyles?: boolean;
  placeholder?: string;
}

export function getBlockExtra(contentNodeType: NodeType): BlockExtra;
export function getBlockExtra(blockContainerNode: PMNode): BlockExtra;
export function getBlockExtra(pos: ResolvedPos): BlockExtra | null;

export function getBlockExtra(input: PMNode | NodeType | ResolvedPos): BlockExtra | null {
  const extra = (contentNodeType: NodeType, isBlock = true) => {
    const result = (contentNodeType.spec.blockExtra ?? {}) as BlockExtra;
    if(result.isBlock === undefined) result.isBlock = isBlock;
    return result;
  };
  if(input instanceof PMNode) {
    return extra(input.firstChild!.type);
  } else if(input instanceof ResolvedPos) {
    const blockContainer = input.doc.type.schema.nodes.blockContainer;
    for(let depth = input.depth; depth >= 0; depth--) {
      const node = input.node(depth);
      if(node.type === blockContainer) return extra(node.firstChild!.type);
      if("blockExtra" in node.type.spec) return extra(node.type, false);
    }
    return null;
  } else {
    return extra(input);
  }
}

/*
export function getBlockExtra($pos: ResolvedPos): BlockExtra | null {
  const result: BlockExtra = {};
  const blockContainer = $pos.doc.type.schema.nodes.blockContainer;

  const addContainer = (node: PMNode) => {
    const extra = node.type.spec.blockExtra as BlockExtra | undefined | null;
    if(extra) {
      for(const [key, value] of Object.entries(extra)) {
        result[key as keyof BlockExtra] = value;
      }
    }
  };

  for(let depth = 0; depth <= $pos.depth; depth++) {
    const node = $pos.node(depth);
    if(node.type === blockContainer) {
      addContainer(node);
    }
  }
}
*/

export function createBlockGroup(schema: Schema, contentNodeType: NodeType, children: Content) {
  const blockExtra = getBlockExtra(contentNodeType);

  const createBlock: (state: Schema, children: Fragment) => PMNode = blockExtra.createBlockGroup
    ?? ((schema, children) => schema.nodes.blockGroup.create({}, children));

  return createBlock(schema, Fragment.from(children));
}
