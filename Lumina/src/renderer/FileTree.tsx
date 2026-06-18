// src/renderer/FileTree.tsx
import React, { useEffect, useState, useCallback, memo } from 'react';

const api = (window as any).luminaAPI;

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
  expanded?: boolean;
  loaded?: boolean;
}

interface FileTreeProps {
  rootPath: string;
  onSelect: (path: string) => void;
}

/** Individual tree node — memoized to avoid re-renders */
const TreeNode = memo<{
  node: FileNode;
  depth: number;
  onSelect: (path: string) => void;
  onToggle: (path: string) => void;
}>(({ node, depth, onSelect, onToggle }) => {
  const ext = node.name.split('.').pop()?.toLowerCase() || '';
  const icon = node.isDir
    ? (node.expanded ? '📂' : '📁')
    : getFileIcon(ext);

  return (
    <>
      <div
        className={`tree-node ${node.isDir ? 'folder' : 'file'}`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => node.isDir ? onToggle(node.path) : onSelect(node.path)}
      >
        <span className="tree-icon">{icon}</span>
        <span className="tree-label">{node.name}</span>
      </div>
      {node.isDir && node.expanded && node.children?.map(child => (
        <TreeNode
          key={child.path}
          node={child}
          depth={depth + 1}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </>
  );
});

function getFileIcon(ext: string): string {
  const icons: Record<string, string> = {
    ts: '🔷', tsx: '⚛️', js: '🟨', jsx: '⚛️',
    json: '📋', css: '🎨', html: '🌐', md: '📝',
    py: '🐍', go: '🔵', rs: '🦀', java: '☕',
  };
  return icons[ext] || '📄';
}

const FileTree: React.FC<FileTreeProps> = ({ rootPath, onSelect }) => {
  const [nodes, setNodes] = useState<FileNode[]>([]);

  // Load root directory when rootPath changes
  useEffect(() => {
    if (!rootPath) {
      setNodes([]);
      return;
    }
    loadDirectory(rootPath).then(setNodes);
  }, [rootPath]);

  const loadDirectory = async (dirPath: string): Promise<FileNode[]> => {
    const entries = await api.listDirectory(dirPath);
    return (entries || []).map((e: any) => ({
      name: e.name,
      path: e.path,
      isDir: e.isDir,
      expanded: false,
      loaded: false,
      children: [],
    }));
  };

  // Toggle a directory open/closed with lazy loading
  const handleToggle = useCallback(async (targetPath: string) => {
    setNodes(prev => toggleNode(prev, targetPath));

    // Lazy-load children if not yet loaded
    setNodes(prev => {
      const node = findNode(prev, targetPath);
      if (node && node.isDir && !node.loaded) {
        // Load async and update
        loadDirectory(targetPath).then(children => {
          setNodes(current => updateNode(current, targetPath, { children, loaded: true }));
        });
      }
      return prev;
    });
  }, []);

  if (!rootPath) {
    return (
      <div className="file-tree-empty">
        <p>No folder open</p>
      </div>
    );
  }

  return (
    <div className="file-tree-content">
      {nodes.map(node => (
        <TreeNode
          key={node.path}
          node={node}
          depth={0}
          onSelect={onSelect}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
};

// Immutable tree helpers
function findNode(nodes: FileNode[], targetPath: string): FileNode | null {
  for (const node of nodes) {
    if (node.path === targetPath) return node;
    if (node.children) {
      const found = findNode(node.children, targetPath);
      if (found) return found;
    }
  }
  return null;
}

function toggleNode(nodes: FileNode[], targetPath: string): FileNode[] {
  return nodes.map(node => {
    if (node.path === targetPath) {
      return { ...node, expanded: !node.expanded };
    }
    if (node.children) {
      return { ...node, children: toggleNode(node.children, targetPath) };
    }
    return node;
  });
}

function updateNode(nodes: FileNode[], targetPath: string, updates: Partial<FileNode>): FileNode[] {
  return nodes.map(node => {
    if (node.path === targetPath) {
      return { ...node, ...updates };
    }
    if (node.children) {
      return { ...node, children: updateNode(node.children, targetPath, updates) };
    }
    return node;
  });
}

export default FileTree;
