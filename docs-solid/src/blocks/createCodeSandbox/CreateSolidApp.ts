interface GetHtmlParameters {
  title: string;
  language: string;
  additionalHeadContent?: string;
}

export const getHtml = ({ title, language, additionalHeadContent }: GetHtmlParameters) => {
  return `<!DOCTYPE html>
<html lang="${language}">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="initial-scale=1, width=device-width" />
    ${additionalHeadContent ?? ''}
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
};

export function getRootIndex(useTypescript: boolean) {
  // document.querySelector returns 'Element | null' but createRoot expects 'Element | DocumentFragment'.
  const type = useTypescript ? '!' : '';

  return `import { render } from 'solid-js/web';
import App from './App';

render(() => <App />, root${type});`;
}

export const getTsconfig = () => `{
  "compilerOptions": {
     // General
    "jsx": "preserve",
    "jsxImportSource": "solid-js",
    "target": "ESNext",

    // Modules
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "noEmit": true,

    // Type Checking & Safety
    "strict": true,
    "types": ["vite/client"]
  },
  "include": [
    "src"
  ]
}
`;
