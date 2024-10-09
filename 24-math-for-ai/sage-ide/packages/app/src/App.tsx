import "@mantine/core/styles.css";
import "./App.css";
import { PropsWithChildren } from "react";
import { Editor } from "./Editor";
import { createTheme, MantineProvider } from "@mantine/core";

function Providers({ children }: PropsWithChildren) {
  return (
    <MantineProvider theme={createTheme({})}>
      {children}
    </MantineProvider>
  );
}

function App() {
  return (
    <Providers>
      <h1>SKKU 이상구 교수 SageMath 글 편집기</h1>
      <Editor />
    </Providers>
  );
}

export default App;
