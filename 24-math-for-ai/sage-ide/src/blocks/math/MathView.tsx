import * as katex from "katex";
import { CSSProperties, useMemo } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const katex_ = katex as any;

type Cls<T> = { new (...args: unknown[]): T };
const { Span, Anchor, Img, SymbolNode, SvgNode, PathNode, LineNode }: {
  Span: Cls<Span>;
  Anchor: Cls<Anchor>;
  Img: Cls<Img>;
  SymbolNode: Cls<SymbolNode>;
  SvgNode: Cls<SvgNode>;
  PathNode: Cls<PathNode>;
  LineNode: Cls<LineNode>;
} = katex_.__domTree;

export function MathView({ tex, options }: { tex: string; options: katex.KatexOptions }) {
  return useMemo(() => {
    const tree = katex_.__renderToDomTree(tex, options);
    return <KatexNode node={tree} />;
  }, [tex, options]);
}

function makeEm(n: number) {
  return `${n.toFixed(4)}em`;
}

function classes(classes: string[]) {
  return classes.filter((c) => c).join(" ")
}

function toNode(tag: string, node: HtmlDomNode) {
  const Tag = tag as "span"; // hack...
  return (
    <Tag
      {...node.attributes}
      className={classes(node.classes)}
      style={node.style}
    >
      {node.children?.map((child) => <KatexNode node={child} />)}
    </Tag>
  );
}

function KatexNode({ node }: { node: VirtualNode }) {
  if(node instanceof Span) {
    return toNode("span", node);
  }
  if(node instanceof Anchor) {
    return toNode("a", node);
  }
  if(node instanceof Img) {
    return (
      <img
        src={node.src}
        alt={node.alt}
        className="mord"
        style={node.style}
      />
    );
  }
  if(node instanceof SymbolNode) {
    return (
      <span
        style={{ marginRight: node.italic > 0 ? makeEm(node.italic) : 0, ...node.style }}
        className={classes(node.classes)}
      >

      </span>
    );
  }
}

/// Type declarations

interface VirtualNode {
  toMarkup(): string;
}

interface HtmlDomNode {
  classes: string[];
  style: CSSProperties;
  attributes?: Record<string, string>;
  children?: VirtualNode[];

  hasClass(className: string): boolean;
}

interface Span extends HtmlDomNode {
  children: VirtualNode[];
  attributes: Record<string, string>;
}

interface Anchor extends HtmlDomNode {
  children: VirtualNode[];
  attributes: Record<string, string>;
}

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
