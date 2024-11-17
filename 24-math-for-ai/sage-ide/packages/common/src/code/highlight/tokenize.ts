import { Grammar } from "shiki";
import { INITIAL } from "shiki/textmate";

declare module "shiki" {
  interface Grammar {
    _rootScopeName: string;
  }
}

export interface Token {
  startIndex: number;
  endIndex: number;
  scopes: string[];
}

const tokenizationMaxLineLength = 200;
const tokenizationLineTimeLimit = 10;

interface TokenizeResult {
  rootScopeName: string;
  tokens: Token[];
}

export function tokenizeCode(code: string, grammar: Grammar): TokenizeResult {
  let stateStack = INITIAL;
  const result: Token[] = [];

  const rootScopeName: string = grammar._rootScopeName;

  for(const [lineStart, lineEnd] of splitLines(code)) {
    if(lineStart === lineEnd) continue;
    if(lineEnd - lineStart > tokenizationMaxLineLength) {
      result.push({ startIndex: lineStart, endIndex: lineEnd, scopes: [] });
      continue;
    }
    const line = code.slice(lineStart, lineEnd);
    const lineResult = grammar.tokenizeLine(line, stateStack, tokenizationLineTimeLimit);
    for(const token of lineResult.tokens) {
      result.push({
        startIndex: lineStart + token.startIndex,
        endIndex: lineStart + token.endIndex,
        scopes: token.scopes.filter((scope) => scope != rootScopeName),
      });
    }

    stateStack = lineResult.ruleStack;
  }

  return {
    rootScopeName,
    tokens: result,
  };
}

function* splitLines(text: string) {
  let start = 0;
  for(let i = 0; i < text.length; i++) {
    const c = text[i];
    let skip = -1;
    if(c === "\n") {
      skip = 1;
    } else if(c === "\r") {
      if(i + 1 < text.length && text[i + 1] === "\n") {
        skip = 2;
      } else {
        skip = 1;
      }
    }
    if(skip !== -1) {
      yield [start, i];
      i += skip;
      start = i;
    }
  }
  yield [start, text.length];
}
