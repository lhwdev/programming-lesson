import katex from "katex";

export function useMathViewRef(tex: string, options: { inline: boolean }): (el: HTMLElement) => void {
  return (el) => {
    katex.render(tex, el, { displayMode: !options.inline });
  };
}
