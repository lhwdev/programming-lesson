import classes from "./TexHints.module.css";
import { memo, useState } from "react";
import { KatexNode, katexRenderToNode, VirtualNode } from "./MathView";
import { SubtleButton } from "@sage-ide/common/components/Button/SubtleButton.tsx";
import { ActionIcon, Button, Tabs, Tooltip } from "@mantine/core";
import clsx from "clsx";

export interface TexHintsProps {
  insertTex: (value: string) => void;
  close: () => void;
}

const Pages = {
  greek: {
    title: "그리스 문자",
    layout: "tinyTiles",
    items: [
      { value: "\\Alpha" },
      { value: "\\Beta" },
      { value: "\\Gamma" },
      { value: "\\Delta" },
      { value: "\\Epsilon" },
      { value: "\\Zeta" },
      { value: "\\Eta" },
      { value: "\\Theta" },
      { value: "\\Iota" },
      { value: "\\Kappa" },
      { value: "\\Lambda" },
      { value: "\\Mu" },
      { value: "\\Nu" },
      { value: "\\Xi" },
      { value: "\\Omicron" },
      { value: "\\Pi" },
      { value: "\\Rho" },
      { value: "\\Sigma" },
      { value: "\\Tau" },
      { value: "\\Upsilon" },
      { value: "\\Phi" },
      { value: "\\Chi" },
      { value: "\\Psi" },
      { value: "\\Omega" },
      { value: "\\alpha" },
      { value: "\\beta" },
      { value: "\\gamma" },
      { value: "\\delta" },
      { value: "\\epsilon" },
      { value: "\\zeta" },
      { value: "\\eta" },
      { value: "\\theta" },
      { value: "\\iota" },
      { value: "\\kappa" },
      { value: "\\lambda" },
      { value: "\\mu" },
      { value: "\\nu" },
      { value: "\\xi" },
      { value: "\\omicron" },
      { value: "\\pi" },
      { value: "\\rho" },
      { value: "\\sigma" },
      { value: "\\tau" },
      { value: "\\upsilon" },
      { value: "\\phi" },
      { value: "\\chi" },
      { value: "\\psi" },
      { value: "\\omega" },
    ],
  },
  symbol: {
    title: "특수 문자",
    layout: "tinyTiles",
    items: [
      { value: "\\mid" },
      { value: "\\nabla", description: "Nabla" },
      { value: "\\partial", description: "편미분" },
      { value: "\\int_{0}^{1}{f(x)\\,dx}", example: "\\int", description: "적분", fontSize: "0.8em" },
      { value: "\\lim_{x \\to 0}{f(x)}", description: "극한" },
      { value: "\\partial", description: "편미분" },
    ],
  },
  operator: {
    title: "연산 기호",
    layout: "tinyTiles",
    items: [
      { value: "+", description: "덧셈" },
      { value: "-", description: "뺄셈" },
      { value: "\\left|\\right|", example: "\\left| \\, \\right|", description: "절대값" },
      { value: "\\times", description: "cross product" },
      { value: "\\cdot", description: "dot product" },
      { value: "\\left\\lVert\\right\\rVert", example: "\\left\\lVert \\, \\right\\rVert", description: "노름" },
      { value: "^", example: "e^x", description: "지수" },
      { value: "_", example: "a_n", description: "아래첨자" },
      { value: "\\cap", description: "교집합" },
      { value: "\\cup", description: "합집합" },
      { value: "\\in", description: "집합 원소" },
      { value: "\\subset", description: "부분집합" },
    ],
  },
  logic: {
    title: "논리 기호",
    layout: "tinyTiles",
    items: [
      { value: "=", description: "등호" },
      { value: "\\ne", description: "부등호" },
      { value: "\\sim", description: "유사" },
      { value: "\\approx", description: "근사" },
      { value: ">", description: "크다" },
      { value: "\\geq", description: "크거나 같다" },
      { value: "\\gg", description: "많이 크다" },
      { value: "\\ggg", description: "겁나 크다" },
      { value: "<", description: "작다" },
      { value: "\\leq", description: "작거나 같다" },
      { value: "\\ll", description: "많이 작다" },
      { value: "\\lll", description: "겁나 작다" },
      { value: "\\forall", description: "모든" },
      { value: "\\exists", description: "어떤" },
      { value: "\\exists !", description: "유일한" },
      { value: "\\nexists", description: "존재하지 않는" },
      { value: "\\to" },
      { value: "\\Rightarrow" },
      { value: "\\leftrightarrow" },
      { value: "\\Leftrightarrow" },
      { value: "\\therefore", description: "그러므로" },
      { value: "\\because", description: "이유" },
    ],
  },
  font: {
    title: "서체",
    layout: "tinyTiles",
    items: [
      { value: "", example: "A", description: "기본 서체" },
      { value: "\\mathnormal", example: "\\mathnormal{X}", description: "기본 서체로 초기화" },
      { value: "\\mathit", example: "\\mathit{u}", description: "이텔릭체" },
      { value: "\\mathrm", example: "\\mathrm{x}", description: "로만" },
      { value: "\\mathrm", example: "\\mathrm{x}", description: "로만" },
      { value: "\\mathbf", example: "\\mathbf{x}", description: "볼드 로만체" },
      { value: "\\R", example: "\\R", description: "블랙보드 서체" },
      { value: "\\text", example: "\\text{hi}", description: "일반 글자" },
      { value: "\\mathcal", example: "\\mathcal{A}", description: "Caligraphic 서체" },
      { value: "\\mathfrak", example: "\\mathfrak{g}", description: "Fraktur 서체" },
      { value: "\\mathsf", example: "\\mathsf{Aa}", description: "Sans-Sarif 서체" },
      { value: "\\mathtt", example: "\\mathtt{if}", description: "Typewriter 서체" },
    ],
  },
  space: {
    title: "공백",
    layout: "list",
    items: [
      {
        value: "\\,",
        example: "a \\, b",
        description: "1칸 띄우기",
      },
      {
        value: "\\;",
        example: "a \\; b",
        description: "2칸 띄우기",
      },
      {
        value: "\\quad",
        example: "a \\quad b",
        description: "4칸 띄우기",
      },
      {
        value: "\\qquad",
        example: "a \\qquad b",
        description: "8칸 띄우기",
      },
    ],
  },
  advanced: {
    title: "고급",
    layout: "list",
    items: [
      {
        value: "\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\\\ \\end{bmatrix}",
        description: "행렬",
      },
    ],
  },
} satisfies Record<string, Page>;
type Pages = typeof Pages;
type Page = {
  title: string;
  layout: "tinyTiles" | "list";
  items: Item[];
};
type Item = {
  value: string;
  example?: string;
  description?: string;
  fontSize?: string;
};

type CachedItem = Omit<Item, "example"> & { example: VirtualNode };
type CachedPage = Omit<Page, "items"> & { items: CachedItem[] };

function renderPages() {
  const mapItem = (item: Item) => ({
    ...item,
    example: katexRenderToNode(item.example ?? item.value, { displayMode: false }),
  });

  const result: Record<string, CachedPage> = {};
  for(const [k, page] of Object.entries(Pages)) {
    result[k] = { ...page, items: page.items.map(mapItem) };
  }
  return result as Record<keyof Pages, CachedPage>;
}

let CachedPages: ReturnType<typeof renderPages> | null = null;

export function TexHints(props: TexHintsProps) {
  const [pageIndex, setPageIndex] = useState<keyof Pages>("greek");
  let pages = CachedPages;
  if(!pages) {
    pages = renderPages();
    CachedPages = pages;
  }

  return (
    <Tabs
      className={classes.tabs}
      orientation="vertical"
      value={pageIndex}
      onChange={(v) => setPageIndex(v as keyof Pages)}
    >
      <Tabs.List p="8px" pr="0">
        {Object.entries(pages).map(([k, page]) => <Tabs.Tab key={k} value={k}>{page.title}</Tabs.Tab>)}
      </Tabs.List>
      {Object.entries(pages).map(([k, page]) => (
        <Tabs.Panel key={k} value={k}>
          <Tooltip.Group openDelay={300} closeDelay={100}>
            <Page page={page} {...props} />
          </Tooltip.Group>
        </Tabs.Panel>
      ))}
    </Tabs>
  );
}

function Page({ page, ...props }: { page: CachedPage } & TexHintsProps) {
  return (
    <div className={clsx(classes.page, classes[page.layout])}>
      {page.items.map((item, index) => (
        <Item
          key={index}
          Comp={(page.layout === "tinyTiles"
            ? ActionIcon
            : SubtleButton) as typeof Button}
          item={item}
          {...props}
        />
      ))}
    </div>
  );
}

function Item({ item, Comp, insertTex }: { item: CachedItem; Comp: typeof Button; insertTex: (tex: string) => void }) {
  const button = (
    <Comp
      variant="subtle"
      color="black"
      onClick={() => insertTex(item.value)}
      style={{ fontSize: item.fontSize }}
    >
      <SimpleKatex>{item.example ?? item.value}</SimpleKatex>
    </Comp>
  );
  return item.description
    ? (
        <Tooltip label={item.description}>
          {button}
        </Tooltip>
      )
    : button;
}

const SimpleKatex = memo(SimpleKatex_);

function SimpleKatex_({ children }: { children: VirtualNode }) {
  return <KatexNode node={children} />;
}
