'use client';

import { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  File,
  FileText,
  FileCode,
  FileJson,
  FileImage,
  Plus,
  FolderPlus,
  Trash2,
  FilePlus,
  Code
} from 'lucide-react';
import { Button } from '../ui/button';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
  lastModified?: string;
}

interface SimpleFileExplorerProps {
  files?: FileNode[];
  projectId?: string;
  onFileSelect: (file: FileNode | string) => void;
  onCreateFile?: (parentPath?: string) => void;
  onCreateFolder?: (parentPath?: string) => void;
  onDeleteFile?: (filePath: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  selectedFile?: string;
  className?: string;
  isScaffolding?: boolean;
}

export function SimpleFileExplorer({ 
  files = [],
  onFileSelect, 
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  selectedFile,
  className = "",
  isScaffolding = false
}: SimpleFileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['/']));

  const handleFolderToggle = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-yellow-500" />;
      case 'html':
      case 'htm':
        return <FileCode className="w-4 h-4 text-orange-500" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <FileCode className="w-4 h-4 text-blue-500" />;
      case 'md':
      case 'txt':
        return <FileText className="w-4 h-4 text-gray-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FileImage className="w-4 h-4 text-purple-500" />;
      default:
        return <File className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`h-full flex flex-col bg-gray-900 ${className}`}>
      {/* Header with create buttons */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <span className="text-sm font-medium text-white">Files</span>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateFile?.()}
            className="p-1 h-6 w-6 flex items-center justify-center"
            title="New File"
          >
            <span>📄</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreateFolder?.()}
            className="p-1 h-6 w-6 flex items-center justify-center"
            title="New Folder"
          >
            <span>📁</span>
          </Button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-auto p-1">
        {files.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <div className="text-center">
              {isScaffolding ? (
                <>
                  <div className="w-8 h-8 mx-auto mb-2 animate-pulse">
                    <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <Code className="w-5 h-5 text-white animate-bounce" />
                    </div>
                  </div>
                  <p className="text-sm text-blue-400 font-medium">Creating project files...</p>
                  <p className="text-xs text-blue-300 mt-1">Files will appear as they are generated</p>
                </>
              ) : (
                <>
                  <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-gray-300">No files</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <FileTreeView
            files={files}
            onFileSelect={onFileSelect}
            onFolderToggle={handleFolderToggle}
            selectedFile={selectedFile}
            expandedFolders={expandedFolders}
            getFileIcon={getFileIcon}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            onDeleteFile={onDeleteFile}
            onDeleteFolder={onDeleteFolder}
            level={0}
          />
        )}
      </div>
    </div>
  );
}

interface FileTreeViewProps {
  files: FileNode[];
  onFileSelect: (file: FileNode | string) => void;
  onFolderToggle: (path: string) => void;
  selectedFile?: string;
  expandedFolders: Set<string>;
  getFileIcon: (name: string) => React.ReactNode;
  onCreateFile?: (parentPath?: string) => void;
  onCreateFolder?: (parentPath?: string) => void;
  onDeleteFile?: (filePath: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  level: number;
}

function FileTreeView({
  files,
  onFileSelect,
  onFolderToggle,
  selectedFile,
  expandedFolders,
  getFileIcon,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  level
}: FileTreeViewProps) {
  return (
    <div>
      {files.map((file) => (
        <FileTreeNode
          key={file.path}
          node={file}
          onFileSelect={onFileSelect}
          onFolderToggle={onFolderToggle}
          selectedFile={selectedFile}
          expandedFolders={expandedFolders}
          getFileIcon={getFileIcon}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDeleteFile={onDeleteFile}
          onDeleteFolder={onDeleteFolder}
          level={level}
        />
      ))}
    </div>
  );
}

interface FileTreeNodeProps {
  node: FileNode;
  onFileSelect: (file: FileNode | string) => void;
  onFolderToggle: (path: string) => void;
  selectedFile?: string;
  expandedFolders: Set<string>;
  getFileIcon: (name: string) => React.ReactNode;
  onCreateFile?: (parentPath?: string) => void;
  onCreateFolder?: (parentPath?: string) => void;
  onDeleteFile?: (filePath: string) => void;
  onDeleteFolder?: (folderPath: string) => void;
  level: number;
}

function FileTreeNode({
  node,
  onFileSelect,
  onFolderToggle,
  selectedFile,
  expandedFolders,
  getFileIcon,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  level
}: FileTreeNodeProps) {
  const isSelected = selectedFile === node.path;
  const isExpanded = expandedFolders.has(node.path);
  const hasChildren = node.children && node.children.length > 0;

  const handleClick = () => {
    if (node.type === 'directory') {
      onFolderToggle(node.path);
    } else {
      onFileSelect(node);
    }
  };

  const handleCreateFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateFile?.(node.type === 'directory' ? node.path : node.path.split('/').slice(0, -1).join('/'));
  };

  const handleCreateFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateFolder?.(node.type === 'directory' ? node.path : node.path.split('/').slice(0, -1).join('/'));
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmMessage = node.type === 'directory' 
      ? `Are you sure you want to delete the folder "${node.name}" and all its contents?`
      : `Are you sure you want to delete the file "${node.name}"?`;
    
    if (confirm(confirmMessage)) {
      if (node.type === 'directory') {
        onDeleteFolder?.(node.path);
      } else {
        onDeleteFile?.(node.path);
      }
    }
  };

  return (
    <div>
      <div
        className={`flex items-center justify-between py-0.5 px-2 rounded cursor-pointer group transition-colors ${
          isSelected 
            ? 'bg-blue-600 text-white' 
            : 'hover:bg-gray-700 text-gray-300'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
      >
        {/* Left side: Icons and Name */}
        <div className="flex items-center min-w-0 flex-1">
          {/* Expand/Collapse Icon */}
          {node.type === 'directory' ? (
            <div className="flex items-center mr-1">
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-gray-400" />
                )
              ) : (
                <div className="w-3 h-3" />
              )}
            </div>
          ) : (
            <div className="w-4 mr-1" />
          )}
          
          {/* File/Folder Icon */}
          {node.type === 'directory' ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
            )
          ) : (
            <div className="mr-2">
              {getFileIcon(node.name)}
            </div>
          )}
          
          {/* File/Folder Name */}
          <span className="text-sm truncate">
            {node.name}
          </span>
        </div>

        {/* Right side: Action Buttons (always present but invisible until hover) */}
        <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0 min-w-[80px] justify-end">
          {node.type === 'directory' ? (
            <>
              <button
                onClick={handleCreateFile}
                className="p-1 rounded text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-colors text-xs font-bold flex items-center justify-center w-6 h-6"
                title="New File"
              >
                <span>📄</span>
              </button>
              <button
                onClick={handleCreateFolder}
                className="p-1 rounded text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition-colors text-xs font-bold flex items-center justify-center w-6 h-6"
                title="New Folder"
              >
                <span>📁</span>
              </button>
              <button
                onClick={handleDelete}
                className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors flex items-center justify-center w-6 h-6"
                title="Delete Folder"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              {/* Invisible spacers to maintain consistent layout */}
              <div className="w-6 h-6"></div>
              <div className="w-6 h-6"></div>
              <button
                onClick={handleDelete}
                className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-colors flex items-center justify-center w-6 h-6"
                title="Delete File"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Children */}
      {node.type === 'directory' && isExpanded && node.children && (
        <FileTreeView
          files={node.children}
          onFileSelect={onFileSelect}
          onFolderToggle={onFolderToggle}
          selectedFile={selectedFile}
          expandedFolders={expandedFolders}
          getFileIcon={getFileIcon}
          onCreateFile={onCreateFile}
          onCreateFolder={onCreateFolder}
          onDeleteFile={onDeleteFile}
          onDeleteFolder={onDeleteFolder}
          level={level + 1}
        />
      )}
    </div>
  );
}