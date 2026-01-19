import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, onChange, readOnly = false }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="300px"
      theme={oneDark}
      extensions={[python()]}
      onChange={onChange}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: true,
        autocompletion: true,
        bracketMatching: true,
        closeBrackets: true,
        indentOnInput: true,
      }}
      style={{
        fontSize: "14px",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    />
  );
}
