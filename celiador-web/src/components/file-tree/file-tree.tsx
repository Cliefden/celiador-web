'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, File, Folder, FolderOpen } from 'lucide-react';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
}

interface FileTreeProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  selectedFile?: string;
}

export function FileTree({ files, onFileSelect, selectedFile }: FileTreeProps) {
  return (
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
        className={`flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 ${
          isSelected 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 mr-2 text-blue-500" />
            ) : (
              <ChevronRight className="w-4 h-4 mr-2 text-blue-500" />
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
        <span className="truncate font-medium">{node.name}</span>
        {node.size && (
          <span className="ml-auto text-xs text-gray-400">
            {node.size > 1024 ? `${(node.size / 1024).toFixed(1)}KB` : `${node.size}B`}
          </span>
        )}
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="mt-1">
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
