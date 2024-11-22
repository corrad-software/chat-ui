import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark.css"; // or any other style you prefer

export default defineNuxtPlugin(() => {
  return {
    provide: {
      hljs: (code: string, language: string) => {
        if (language && hljs.getLanguage(language)) {
          return hljs.highlight(code, { language }).value;
        }
        return hljs.highlightAuto(code).value;
      },
    },
  };
});
