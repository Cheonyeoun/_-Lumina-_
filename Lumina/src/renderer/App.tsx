// src/renderer/App.tsx
import React, { useCallback, useState } from 'react';
import FileTree from './FileTree';
import Editor from './Editor';
import Chat from './Chat';
import ReviewPanel from './ReviewPanel';
import './theme.css';

const api = (window as any).luminaAPI;

export const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [fileContent, setFileContent] = useState<string>('');
  const [projectRoot, setProjectRoot] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<Array<{ question: string; answer: string }>>([]);

  // Open a project folder via native dialog
  const handleOpenFolder = useCallback(async () => {
    const folderPath = await api.openFolderDialog();
    if (folderPath) {
      setProjectRoot(folderPath);
      setSelectedFile('');
      setFileContent('');
    }
  }, []);

  // Load file content when a file is selected
  const handleFileSelect = useCallback(async (filePath: string) => {
    setSelectedFile(filePath);
    const result = await api.readFile(filePath);
    if (result.status === 'ok') {
      setFileContent(result.content);
    } else {
      setFileContent(`// Error loading file: ${result.message}`);
    }
  }, []);

  const handleChatResponse = useCallback((question: string, answer: string) => {
    setChatHistory(prev => [...prev, { question, answer }]);
  }, []);

  return (
    <div className="app-container">
      <div className="pane sidebar">
        <div className="sidebar-header">
          <span className="logo">✦ Lumina</span>
          <button className="btn-open" onClick={handleOpenFolder} title="Open Folder">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M1 3.5A1.5 1.5 0 012.5 2h3.879a1.5 1.5 0 011.06.44l1.122 1.12A1.5 1.5 0 009.62 4H13.5A1.5 1.5 0 0115 5.5v7a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 011 12.5v-9z" />
            </svg>
          </button>
        </div>
        <FileTree rootPath={projectRoot} onSelect={handleFileSelect} />
      </div>
      <div className="pane editor-pane">
        {selectedFile ? (
          <Editor filePath={selectedFile} content={fileContent} />
        ) : (
          <div className="editor-placeholder">
            <div className="placeholder-content">
              <span className="placeholder-icon">✦</span>
              <h2>Welcome to Lumina</h2>
              <p>Open a folder to get started</p>
              <button className="btn-primary" onClick={handleOpenFolder}>Open Folder</button>
            </div>
          </div>
        )}
      </div>
      <div className="pane chat-pane">
        <Chat onResponse={handleChatResponse} />
        <ReviewPanel history={chatHistory} />
      </div>
    </div>
  );
};

export default App;
