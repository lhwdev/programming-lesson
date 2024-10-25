import { ThemeRegistrationResolved } from "shiki";
import { IRawThemeSetting } from "shiki/textmate";

export function classNameForScope(name: string) {
  return "tm-" + name.replace(/[. ]/g, "_");
}

export function classNameForScopes(scopes: string[]) {
  return scopes.length === 0 ? ["tm-default"] : scopes.map(classNameForScope);
}

export function createStyleCssForTheme(theme: ThemeRegistrationResolved) {
  let result = "";
  const settings = theme.settings ?? theme.tokenColors;
  for(const setting of settings) {
    let scopes = typeof setting.scope === "string" ? [setting.scope] : setting.scope ?? [];
    scopes = classNameForScopes(scopes).map((scope) => `.${scope}`);
    const selector = scopes.length === 0 ? ".tm_default" : scopes.join(",");

    result += `${selector}{${stylesForSetting(setting.settings)}}`;
  }
  return result;
}

function stylesForSetting(settings: IRawThemeSetting["settings"]) {
  let result = "";
  if(settings.foreground) result += `color:${settings.foreground};`;
  if(settings.background) result += `background:${settings.background}`;
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
