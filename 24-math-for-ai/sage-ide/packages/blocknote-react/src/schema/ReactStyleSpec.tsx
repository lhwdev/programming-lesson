import {
  addStyleAttributes,
  createInternalStyleSpec,
  DefaultBlockSchema,
  DefaultInlineContentSchema,
  DefaultStyleSchema,
  getStyleParseRules,
  StyleConfig,
  stylePropsToAttributes,
} from "@blocknote/core";
import { Mark } from "@tiptap/react";
import { FC } from "react";
import { renderToDOMSpec } from "./@util/ReactRenderUtil";
import { ReactCommonImplementation, ReactNodeCommonHelper } from "./ReactNodeCommon";
import { MarkType } from "@tiptap/pm/model";

// this file is mostly analogoues to `customBlocks.ts`, but for React blocks

// extend BlockConfig but use a React render function
export interface ReactCustomStyleImplementation<T extends StyleConfig>
  extends ReactCommonImplementation<T, never, DefaultBlockSchema, DefaultInlineContentSchema, DefaultStyleSchema, { type: MarkType }> {
  render: T["propSchema"] extends "boolean"
    ? FC<{ contentRef: (el: HTMLElement | null) => void }>
    : FC<{ contentRef: (el: HTMLElement | null) => void; value: string }>;
};

// A function to create custom block for API consumers
// we want to hide the tiptap node from API consumers and provide a simpler API surface instead
export function createReactStyleSpec<T extends StyleConfig>(
  styleConfig: T,
  impl: ReactCustomStyleImplementation<T>,
) {
  const mark = Mark.create({
    name: styleConfig.type,

    addKeyboardShortcuts() {
      return ReactNodeCommonHelper.addKeyboardShortcuts(this, this.options.editor, impl, {});
    },

    addInputRules() {
      return impl.inputRules?.(this) ?? [];
    },

    addProseMirrorPlugins() {
      return ReactNodeCommonHelper.addProseMirrorPlugins(this.options.editor, this, impl);
    },

    addAttributes() {
      return stylePropsToAttributes(styleConfig.propSchema);
    },

    parseHTML() {
      return getStyleParseRules(styleConfig);
    },

    renderHTML({ mark }) {
      const props: any = {};

      if(styleConfig.propSchema === "string") {
        props.value = mark.attrs.stringValue;
      }

      const Content = impl.render;
      const renderResult = renderToDOMSpec(
        (refCB) => <Content {...props} contentRef={refCB} />,
        undefined,
      );

      return addStyleAttributes(
        renderResult,
        styleConfig.type,
        mark.attrs.stringValue,
        styleConfig.propSchema,
      );
    },
  });

  return createInternalStyleSpec(styleConfig, {
    mark,
  });
}
