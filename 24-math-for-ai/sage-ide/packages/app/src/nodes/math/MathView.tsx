import katex, { KatexOptions } from "katex";
import React, { CSSProperties, memo, ReactNode, useEffect, useMemo, useRef } from "react";
import "./MathView.css";
import { Text } from "@mantine/core";
import { RiSquareRoot } from "react-icons/ri";
import clsx_ from "clsx";

const clsx = (...inputs: Parameters<typeof clsx_>) => inputs.length === 0 ? undefined : clsx_(...inputs);

const katex_ = katex as any;

type Cls<T> = { new (...args: unknown[]): T };
const { Span, Anchor, SymbolNode, SvgNode, PathNode, LineNode }: {
  Span: Cls<Span>;
  Anchor: Cls<Anchor>;
  SymbolNode: Cls<SymbolNode>;
  SvgNode: Cls<SvgNode>;
  PathNode: Cls<PathNode>;
  LineNode: Cls<LineNode>;
} = katex_.__domTree;

// @types/katex katex.ParseError is errorprone
export interface MathError extends Error {
  name: "ParseError";

  position: number;
  length: number;
  rawMessage: string;
}

export interface MathViewOptions extends KatexOptions {
  editing?: boolean;
}

export type MathResult = { node?: ReactNode; error?: MathError };

export function katexRenderToNode(tex: string, options: KatexOptions): VirtualNode {
  return katex_.__renderToDomTree(tex, { ...options } satisfies KatexOptions);
}

export function useMathView(tex: string, { editing, ...options }: MathViewOptions): MathResult {
  const previous = useMemo<{ current: MathResult | null }>(() => ({ current: {} }), []);
  const result = useMemo(() => {
    if(tex === "") return {};
    try {
      const tree = katexRenderToNode(tex, options);
      const result = <RootKatexNode node={tree} />;
      const RootNode = options.displayMode ? "div" : "span";
      return {
        node: (
          <RootNode className="bn-math-view">
            {result}
          </RootNode>
        ),
      };
    } catch (e) {
      if(e instanceof katex.ParseError) {
        return { error: e as MathError };
      } else {
        throw e;
      }
    }
  }, [tex, options]);

  useEffect(() => {
    if(!editing) {
      previous.current = null;
    } else {
      if(result.node) previous.current = result;
    }
  }, [editing && result.node]);

  if(editing && !result.node) {
    const value = previous.current;
    if(value) return {
      node: value.node,
      error: result.error,
    };
  }
  return result;
}

export function MathView({ result }: { result: MathResult }) {
  if(result.node || !result.error) {
    if(!result.node) { // tex === ""
      return <MathPlaceholder type="default">새로운 수학공식</MathPlaceholder>;
    }
    return result.node;
  } else {
    return (
      <MathPlaceholder type="error">유효하지 않은 수식입니다.</MathPlaceholder>
    );
  }
}

function MathPlaceholder({ type, children }: { type: string; children: ReactNode }) {
  return (
    <Text
      component="span"
      className="bn-math-view-placeholder"
      data-type={type}
    >
      <RiSquareRoot />
      {children}
    </Text>
  );
}

function makeEm(n: number) {
  return `${n.toFixed(4)}em`;
}

function mapChildren(children?: VirtualNode[]) {
  return children?.map((child, index) => <KatexNode key={index} node={child} />);
}

function toNode(tag: string, node: HtmlDomNode) {
  const Tag = tag as "span"; // hack...
  return (
    <Tag
      {...node.attributes}
      className={clsx(...node.classes)}
      style={node.style}
    >
      {mapChildren(node.children)}
    </Tag>
  );
}

export const RootKatexNode = memo(KatexNode);

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const ParseInstanceMap = new Map<Function, (node: any) => ReactNode>([
  [Span, (node: Span) => toNode("span", node)],
  [Anchor, (node: Anchor) => toNode("span", node)],
  [SymbolNode, (node: SymbolNode) => (
    <span
      className={clsx(...node.classes)}
      style={{ marginRight: node.italic > 0 ? makeEm(node.italic) : 0, ...node.style }}
    >
      {node.text}
    </span>
  )],
  [SvgNode, (node: SvgNode) => (
    <svg xmlns="http://www.w3.org/2000/svg" {...node.attributes}>
      {mapChildren(node.children)}
    </svg>
  )],
  [PathNode, (node: SvgNode) => {
    const dom = node.toNode() as SVGPathElement;
    return <path d={dom.getAttribute("d")!} />;
  }],
  [LineNode, (node: LineNode) => <line {...node.attributes} />],
]);
const ParseNameMap = new Map<string, (node: any) => ReactNode>([
  ["DocumentFragment", (node: DocumentFragment) => <>{mapChildren(node.children)}</>],
  ["MathNode", (node: MathNode) => {
    const Tag = node.type as MathNodeType;
    return (
      <Tag
        xmlns={Tag === "math" ? "http://www.w3.org/1998/Math/MathML" : undefined}
        {...node.attributes}
        className={clsx(...node.classes)}
      >
        {mapChildren(node.children)}
      </Tag>
    );
  }],
  ["TextNode", (node: TextNode) => node.text],
  ["SpaceNode", (node: SpaceNode) => {
    if(node.character) {
      return node.character;
    } else {
      return <mspace width={makeEm(node.width)} />;
    }
  }],
]);

export function KatexNode({ node }: { node: VirtualNode }) {
  const type = node.constructor;
  const instance = ParseInstanceMap.get(type) ?? ParseNameMap.get(type.name);
  if(instance) return instance(node);

  console.error("unknown node", node);
  throw new Error(`unknown node ${node.constructor?.name ?? node}`);
}

/// Type declarations

export interface VirtualNode {
  toNode(): Node;
  toMarkup(): string;
}

interface HtmlDomNode extends VirtualNode {
  classes: string[];
  style: CSSProperties;
  attributes?: Record<string, string>;
  children?: VirtualNode[];

  hasClass(className: string): boolean;
}

// Common
interface DocumentFragment extends HtmlDomNode {
  children: VirtualNode[];
  height: number;
  depth: number;
  maxFontSize: number;
}

// DOM
interface Span extends HtmlDomNode {
  children: VirtualNode[];
  attributes: Record<string, string>;
}

interface Anchor extends HtmlDomNode {
  children: VirtualNode[];
  attributes: Record<string, string>;
}

// interface Img extends VirtualNode {
//   src: string;
//   alt: string;
//   style: CSSProperties;
//   classes: string[];
// }

interface SymbolNode extends HtmlDomNode {
  text: string;
  italic: number;
  skew: number;
}

interface SvgNode extends VirtualNode {
  attributes: Record<string, string>;
  children: SvgChildNode[];
}

interface PathNode extends VirtualNode {
  pathName: string;
  alternate?: string;
}

interface LineNode extends VirtualNode {
  attributes: Record<string, string>;
}

type SvgChildNode = PathNode | LineNode;

// MathML
type MathNodeType =
  "math" | "annotation" | "semantics" |
  "mtext" | "mn" | "mo" | "mi" | "mspace" |
  "mover" | "munder" | "munderover" | "msup" | "msub" | "msubsup" |
  "mfrac" | "mroot" | "msqrt" |
  "mtable" | "mtr" | "mtd" | "mlabeledtr" |
  "mrow" | "menclose" |
  "mstyle" | "mpadded" | "mphantom" | "mglyph";

interface MathDOMNode extends VirtualNode {
  toText(): string;
}

interface MathNode extends MathDOMNode {
  type: string;
  attributes: Record<string, string>;
  children: MathDOMNode[];
  classes: string[];
}

interface TextNode extends MathDOMNode {
  text: string;
}

interface SpaceNode extends MathDOMNode {
  width: number;
  character?: string;
}

// @types/react does not support MathML elements, but it actually exists
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface MathMLAttributes<T> extends React.AriaAttributes, React.DOMAttributes<T> {
      width?: CSSProperties["width"];

      autofocus?: boolean;
      className?: string;
      dir?: "ltr" | "rtl" | string;
      displaystyle?: boolean;
      id?: string;
      mathbackground?: CSSProperties["backgroundColor"];
      mathcolor?: CSSProperties["color"];
      mathsize?: CSSProperties["fontSize"];
      nonce?: string;
      scriptlevel?: `${"+" | "-" | ""}${number}`;
      style?: CSSProperties;
      tabIndex?: number;

      xmlns?: string | undefined;
    }

    type IntrinsicMathMLElements = {
      [Key in MathNodeType]: React.DetailedHTMLProps<MathMLAttributes<MathMLElement>, MathMLElement>;
    };

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements extends IntrinsicMathMLElements {
    }
  }
}
