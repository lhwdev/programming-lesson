import { HighlighterCore } from "shiki";
import { INITIAL } from "shiki/textmate";

export interface Token {
  startIndex: number;
  endIndex: number;
  scopes: string[];
}

const tokenizationMaxLineLength = 200;
const tokenizationLineTimeLimit = 10;

export function tokenizeCode(code: string, lang: string, highlighter: HighlighterCore): Token[] {
  const grammer = highlighter.getLanguage(lang);

  let stateStack = INITIAL;
  const result: Token[] = [];

  for(const [lineStart, lineEnd] of splitLines(code)) {
    if(lineStart === lineEnd) continue;
    if(lineEnd - lineStart > tokenizationMaxLineLength) {
      result.push({ startIndex: lineStart, endIndex: lineEnd, scopes: [] });
      continue;
    }
    const line = code.slice(lineStart, lineEnd);
    const lineResult = grammer.tokenizeLine(line, stateStack, tokenizationLineTimeLimit);
    for(const token of lineResult.tokens) {
      result.push({
        startIndex: lineStart + token.startIndex,
        endIndex: lineStart + token.endIndex,
        scopes: token.scopes,
      });
    }

    stateStack = lineResult.ruleStack;
  }

  return result;
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
