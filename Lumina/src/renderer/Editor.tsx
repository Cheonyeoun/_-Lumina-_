// src/renderer/Editor.tsx
import React, { useMemo } from 'react';
import MonacoEditor from '@monaco-editor/react';

interface EditorProps {
  filePath: string;
  content: string;
}

/** Detect language from file extension */
function getLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  const langMap: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', java: 'java', cs: 'csharp', go: 'go', rs: 'rust',
    cpp: 'cpp', c: 'c', h: 'c', json: 'json', html: 'html',
    css: 'css', scss: 'scss', md: 'markdown', yaml: 'yaml', yml: 'yaml',
    xml: 'xml', sql: 'sql', sh: 'shell', bat: 'bat', ps1: 'powershell',
    toml: 'ini', txt: 'plaintext',
  };
  return langMap[ext] || 'plaintext';
}

const Editor: React.FC<EditorProps> = ({ filePath, content }) => {
  const language = useMemo(() => getLanguage(filePath), [filePath]);

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <div className="editor-tab">
        <span className="tab-name">{filePath.split(/[/\\]/).pop() || 'Untitled'}</span>
      </div>
      <MonacoEditor
        height="calc(100% - 36px)"
        language={language}
        value={content}
        theme="vs-dark"
        options={{
          automaticLayout: true,
          fontSize: 14,
          minimap: { enabled: true, scale: 1 },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          padding: { top: 8 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'gutter',
          bracketPairColorization: { enabled: true },
        }}
      />
    </div>
  );
};

export default Editor;
