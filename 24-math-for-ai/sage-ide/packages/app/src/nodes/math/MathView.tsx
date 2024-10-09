import katex, { KatexOptions } from "katex";
import React, { CSSProperties, memo, ReactNode, useMemo } from "react";
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

type MathResult = { node: ReactNode; error?: undefined } |
  { node?: undefined; error: katex.ParseError };

export function katexRenderToNode(tex: string, options: KatexOptions): VirtualNode {
  return katex_.__renderToDomTree(tex, { ...options, output: "htmlAndMathml" } satisfies KatexOptions);
}

const EmptyTex = <div />;

export function useMathView(tex: string, options: KatexOptions): MathResult {
  return useMemo(() => {
    if(tex === "") return { node: EmptyTex };
    try {
      // TODO: 'output: "html"': support mathml for accessibility and paste-ability?
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
        return { error: e };
      } else {
        throw e;
      }
    }
  }, [tex, options]);
}

export function MathView({ result }: { result: MathResult }) {
  if(result.node) {
    if(result.node === EmptyTex) { // tex === ""
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

export function KatexNode({ node }: { node: VirtualNode }) {
  if(node instanceof Span) {
    return toNode("span", node);
  }
  if(node instanceof Anchor) {
    return toNode("a", node);
  }
  // Only used for external image direction (which is blocked by default)
  // if(node instanceof Img) {
  //   return (
  //     <img
  //       src={node.src}
  //       alt={node.alt}
  //       className="mord"
  //       style={node.style}
  //     />
  //   );
  // }
  if(node instanceof SymbolNode) {
    return (
      <span
        className={clsx(...node.classes)}
        style={{ marginRight: node.italic > 0 ? makeEm(node.italic) : 0, ...node.style }}
      >
        {node.text}
      </span>
    );
  }
  if(node instanceof SvgNode) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" {...node.attributes}>
        {mapChildren(node.children)}
      </svg>
    );
  }
  if(node instanceof PathNode) {
    const dom = node.toNode() as SVGPathElement;
    return <path d={dom.getAttribute("d")!} />;
  }
  if(node instanceof LineNode) {
    return <line {...node.attributes} />;
  }

  const name = node.constructor.name;
  // Common tree
  if(name === "DocumentFragment") {
    const n = node as DocumentFragment;
    return <>{mapChildren(n.children)}</>;
  }

  // MathML node
  if(name === "MathNode") {
    const n = node as MathNode;
    const Tag = n.type as MathNodeType;
    return (
      <Tag
        xmlns={Tag === "math" ? "http://www.w3.org/1998/Math/MathML" : undefined}
        {...n.attributes}
        className={clsx(...n.classes)}
      >
        {mapChildren(n.children)}
      </Tag>
    );
  }
  if(name === "TextNode") {
    return (node as TextNode).text;
  }
  if(name === "SpaceNode") {
    const n = node as SpaceNode;
    if(n.character) {
      return n.character;
    } else {
      return <mspace width={makeEm(n.width)} />;
    }
  }

  console.error("unknown node", node);
  throw new Error(`unknown node ${node.constructor?.name ?? node}`);
}

/// Type declarations

interface VirtualNode {
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface Img extends VirtualNode {
  src: string;
  alt: string;
  style: CSSProperties;
  classes: string[];
}

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
