import Editor from '@monaco-editor/react';
import { Box } from "@mui/material";

interface CodeEditorProps {
  value: string;
  readOnly?: boolean;
  onChange?: (value: string | undefined) => void;
}

function CodeEditor({ value, readOnly = false, onChange }: CodeEditorProps) {
  return (
    <Box sx={{ height: "100%" }}>
      <Editor
        height="100%"
        language="javascript"
        value={value}
        theme="vs-dark"
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 12,
          scrollBeyondLastLine: false,
        }}
        onChange={onChange}
      />
    </Box>
  );
}

export default CodeEditor;