'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile?: string;
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
  return (
    <div className="w-full h-full overflow-auto">
      <div className="p-2">
        <h3 className="text-sm font-medium mb-2">Files</h3>
        <div className="space-y-1">
          {files.map((file) => (
            <FileTreeNode
              key={file.path}
              node={file}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  onFileSelect: (file: FileNode) => void;
  selectedFile?: string;
  level?: number;
}

function FileTreeNode({ node, onFileSelect, selectedFile, level = 0 }: FileTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isSelected = selectedFile === node.path;

  const handleClick = () => {
    if (node.type === 'directory') {
      setIsExpanded(!isExpanded);
    } else {
      onFileSelect(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center px-2 py-1 rounded text-sm cursor-pointer transition-colors ${
          isSelected 
            ? 'bg-primary text-primary-foreground' 
            : 'hover:bg-muted'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-1" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-1" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
            )}
          </>
        ) : (
          <File className="w-4 h-4 mr-2 text-gray-500" />
        )}
        <span className="truncate">{node.name}</span>
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
