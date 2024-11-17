import clsx from "clsx";
import { ThemeRegistrationResolved } from "shiki";
import { IRawThemeSetting } from "shiki/textmate";

export const globalCodeRootName = "bn-code-tm-root";
// const globalStyleName = "bn-code-tm";
const globalStylePrefix = "t";

const scopePathMap = new Map<string, PathElement>();
const scopeMap = new Map<Path, string>();

let scopePathCounter = 0;
let scopeCounter = 0;
const radix = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

type PathElement = number;
type Path = number;
function joinToPath(elements: PathElement[]): Path {
  return elements.reduce((acc, element) => Math.imul(acc, 31) + element, 0);
}

function incrementalName(n: number) {
  let result = "";
  for(let i = 0; i < 2; i++) {
    result += radix[n % radix.length];
    n = Math.trunc(n / radix.length);
  }
  return result.length ? result : "0";
}

export function scopePath(name: string) {
  const scopePathElement = (element: string) => {
    const existing = scopePathMap.get(element);
    if(existing) return existing;

    const result = scopePathCounter++;
    scopePathMap.set(element, result);
    return result;
  };
  return name.split(".").map(scopePathElement);
}

export function pathToScope(path: PathElement[]) {
  const key = joinToPath(path);
  const existing = scopeMap.get(key);
  if(existing) return existing;
  const result = incrementalName(scopeCounter++);
  scopeMap.set(key, result);
  return result;
}

export function classRuleForScopeDefinition(scopes: string[]) {
  if(scopes.length === 0) return "*";
  const paths = scopes.map(scopePath)
    .map((path) => `.${globalStylePrefix}${pathToScope(path)}`);
  return paths.join(",");
}

export function classNameForScopeUsage(scopes: string[]) {
  const paths = scopes.map(scopePath);

  const mapPath = (path: PathElement[]) => {
    const result = [];
    let accumulator: PathElement[] = [];
    for(const element of path) {
      accumulator = [...accumulator, element];
      result.push(`${globalStylePrefix}${pathToScope(accumulator)}`);
    }
    return result;
  };

  return clsx(
    paths.map(mapPath),
  );
}

export function createStyleCssForTheme(theme: ThemeRegistrationResolved) {
  let result = "";
  const settings = theme.settings ?? theme.tokenColors;
  for(const setting of settings) {
    const scopes = typeof setting.scope === "string" ? [setting.scope] : setting.scope ?? [];
    const selector = classRuleForScopeDefinition(scopes);

    result += `${selector}{${stylesForSetting(scopes, setting.settings)}}\n`;
  }
  return `@scope(.${globalCodeRootName}){ ${result} }`;
}

function stylesForSetting(scopes: string[], settings: IRawThemeSetting["settings"]) {
  let result = "";
  if((import.meta as any).env?.DEV) result += `--scopes:"${scopes.join(", ")}";`;
  if(settings.foreground) result += `color:${settings.foreground};`;
  if(settings.background) {
    if(scopes.length > 0) result += `background:${settings.background};`;
  }
  if(settings.fontStyle) {
    const styles = settings.fontStyle.split(" ");
    for(const style of styles) {
      switch(style) {
        case "italic":
          result += "font-style:italic;";
          break;
        case "bold":
          result += "font-weight:bold;";
          break;
        case "underline":
          result += "text-decoration:underline;";
          break;
        case "strikethrough":
          result += "text-decoration:line-through;";
          break;
      }
    }
  }
  return result;
}
