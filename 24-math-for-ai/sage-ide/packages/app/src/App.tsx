import "@mantine/core/styles.css";
import "./App.css";
import { PropsWithChildren, useEffect, useRef } from "react";
import { Editor } from "./Editor";
import { createTheme, MantineProvider } from "@mantine/core";
import { createMonaco } from "@sage-ide/monaco-block/index.tsx";

function Providers({ children }: PropsWithChildren) {
  return (
    <MantineProvider theme={createTheme({})}>
      {children}
    </MantineProvider>
  );
}

function App() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    createMonaco(ref.current!);
  });
  return (
    <Providers>
      <h1>SKKU 이상구 교수 SageMath 글 편집기</h1>
      <div style={{ height: 600 }} ref={ref} />
      <Editor />
    </Providers>
  );
}

export default App;
