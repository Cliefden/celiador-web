'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  FolderOpen,
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit3,
  Eye,
  Copy,
  MoreVertical,
  FileText,
  Code,
  Image,
  Archive,
  FileCode,
  FileJson,
  FileType,
  FileImage,
  FileVideo,
  FileAudio,
  FilePdf,
  FileZip
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast } from '../ui/toast';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
  lastModified?: string;
  permissions?: string;
}

interface FileExplorerProps {
  files?: FileNode[];
  projectId?: string;
  onFileSelect: (file: FileNode | string) => void;
  onFileEdit?: (file: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
  onFileUpload?: (file: File) => void;
  onFileDownload?: (file: FileNode) => void;
  selectedFile?: string;
  className?: string;
}

export function FileExplorer({ 
  files, 
  onFileSelect, 
  onFileEdit,
  onFileDelete,
  onFileUpload,
  onFileDownload,
  selectedFile, 
  projectId,
  className = ""
}: FileExplorerProps) {
  const { success, error, info } = useToast();
  
  // Gentle debugging
  useEffect(() => {
    console.log('[FileExplorer] Received files:', files?.length || 0, 'files');
    console.log('[FileExplorer] Selected file:', selectedFile);
    console.log('[FileExplorer] Files array is valid:', Array.isArray(files));
    if (files && files.length > 0) {
      console.log('[FileExplorer] Sample file:', files[0]);
    }
  }, [files, selectedFile]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [sortBy, setSortBy] = useState<'name' | 'type' | 'size' | 'modified'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showHidden, setShowHidden] = useState(false);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = filterFiles(files, searchTerm, showHidden);
    return sortFiles(filtered, sortBy, sortOrder);
  }, [files, searchTerm, showHidden, sortBy, sortOrder]);

  const handleFolderToggle = (folderPath: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderPath)) {
      newExpanded.delete(folderPath);
    } else {
      newExpanded.add(folderPath);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFileOperation = async (operation: string, file: FileNode) => {
    try {
      switch (operation) {
        case 'edit':
          onFileEdit?.(file);
          break;
        case 'delete':
          if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
            onFileDelete?.(file);
            success('File Deleted', `${file.name} has been deleted`);
          }
          break;
        case 'download':
          onFileDownload?.(file);
          success('Download Started', `${file.name} is being downloaded`);
          break;
        case 'copy':
          await navigator.clipboard.writeText(file.path);
          success('Path Copied', 'File path copied to clipboard');
          break;
        default:
          break;
      }
    } catch (err) {
      error('Operation Failed', 'An error occurred while performing the operation');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => {
        onFileUpload?.(file);
      });
      success('Files Uploaded', `${files.length} file(s) uploaded successfully`);
    }
    // Reset input
    event.target.value = '';
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-4 h-4 text-yellow-500" />;
      case 'json':
        return <FileJson className="w-4 h-4 text-green-500" />;
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
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className="w-4 h-4 text-red-500" />;
      case 'mp3':
      case 'wav':
        return <FileAudio className="w-4 h-4 text-green-500" />;
      case 'pdf':
        return <FilePdf className="w-4 h-4 text-red-500" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <FileZip className="w-4 h-4 text-orange-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (size?: number) => {
    if (!size) return '';
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center">
              <Folder className="w-5 h-5 mr-2 text-blue-500" />
              Project Files
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'tree' ? 'list' : 'tree')}
                className="text-xs"
              >
                {viewMode === 'tree' ? 'List' : 'Tree'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHidden(!showHidden)}
                className="text-xs"
              >
                {showHidden ? 'Hide' : 'Show'} Hidden
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Search and Controls */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-1">
              <label className="relative cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button variant="outline" size="sm" className="text-xs">
                  <Upload className="w-3 h-3 mr-1" />
                  Upload
                </Button>
              </label>
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-xs text-gray-500">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="name">Name</option>
              <option value="type">Type</option>
              <option value="size">Size</option>
              <option value="modified">Modified</option>
            </select>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-xs p-1"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Tree/List */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full overflow-auto">
            {filteredAndSortedFiles.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Folder className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No files found</p>
                  <p className="text-sm text-gray-400">
                    {searchTerm ? 'Try adjusting your search' : 'Upload files to get started'}
                  </p>
                </div>
              </div>
            ) : viewMode === 'tree' ? (
              <FileTreeView
                files={filteredAndSortedFiles}
                onFileSelect={onFileSelect}
                onFileOperation={handleFileOperation}
                selectedFile={selectedFile}
                expandedFolders={expandedFolders}
                onFolderToggle={handleFolderToggle}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
              />
            ) : (
              <FileListView
                files={filteredAndSortedFiles}
                onFileSelect={onFileSelect}
                onFileOperation={handleFileOperation}
                selectedFile={selectedFile}
                getFileIcon={getFileIcon}
                formatFileSize={formatFileSize}
                formatDate={formatDate}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper functions
function filterFiles(files: FileNode[] | null | undefined, searchTerm: string, showHidden: boolean): FileNode[] {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  const filterRecursive = (nodes: FileNode[]): FileNode[] => {
    if (!nodes || !Array.isArray(nodes)) {
      return [];
    }
    
    return nodes
      .filter(node => {
        // Filter hidden files
        if (!showHidden && node.name.startsWith('.')) {
          return false;
        }
        
        // Filter by search term
        if (searchTerm) {
          const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               node.path.toLowerCase().includes(searchTerm.toLowerCase());
          if (!matchesSearch) {
            // Check if any children match
            if (node.children) {
              const filteredChildren = filterRecursive(node.children);
              return filteredChildren.length > 0;
            }
            return false;
          }
        }
        
        return true;
      })
      .map(node => ({
        ...node,
        children: node.children ? filterRecursive(node.children) : undefined
      }));
  };

  return filterRecursive(files);
}

function sortFiles(files: FileNode[] | null | undefined, sortBy: string, sortOrder: 'asc' | 'desc'): FileNode[] {
  if (!files || !Array.isArray(files)) {
    return [];
  }

  const sortRecursive = (nodes: FileNode[]): FileNode[] => {
    if (!nodes || !Array.isArray(nodes)) {
      return [];
    }
    
    return nodes
      .map(node => ({
        ...node,
        children: node.children ? sortRecursive(node.children) : undefined
      }))
      .sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'type':
            comparison = a.type.localeCompare(b.type);
            break;
          case 'size':
            comparison = (a.size || 0) - (b.size || 0);
            break;
          case 'modified':
            comparison = (a.lastModified || '').localeCompare(b.lastModified || '');
            break;
          default:
            comparison = a.name.localeCompare(b.name);
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  };

  return sortRecursive(files);
}

// Tree View Component
interface FileTreeViewProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileOperation: (operation: string, file: FileNode) => void;
  selectedFile?: string;
  expandedFolders: Set<string>;
  onFolderToggle: (path: string) => void;
  getFileIcon: (name: string) => React.ReactNode;
  formatFileSize: (size?: number) => string;
  formatDate: (date?: string) => string;
}

function FileTreeView({
  files,
  onFileSelect,
  onFileOperation,
  selectedFile,
  expandedFolders,
  onFolderToggle,
  getFileIcon,
  formatFileSize,
  formatDate
}: FileTreeViewProps) {
  return (
    <div className="space-y-1 p-2">
      {files.map((file) => (
        <FileTreeNode
          key={file.path}
          node={file}
          onFileSelect={onFileSelect}
          onFileOperation={onFileOperation}
          selectedFile={selectedFile}
          expandedFolders={expandedFolders}
          onFolderToggle={onFolderToggle}
          getFileIcon={getFileIcon}
          formatFileSize={formatFileSize}
          formatDate={formatDate}
          level={0}
        />
      ))}
    </div>
  );
}

// List View Component
interface FileListViewProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileOperation: (operation: string, file: FileNode) => void;
  selectedFile?: string;
  getFileIcon: (name: string) => React.ReactNode;
  formatFileSize: (size?: number) => string;
  formatDate: (date?: string) => string;
}

function FileListView({
  files,
  onFileSelect,
  onFileOperation,
  selectedFile,
  getFileIcon,
  formatFileSize,
  formatDate
}: FileListViewProps) {
  const flattenFiles = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = [];
    nodes.forEach(node => {
      result.push(node);
      if (node.children) {
        result.push(...flattenFiles(node.children));
      }
    });
    return result;
  };

  const flatFiles = flattenFiles(files);

  return (
    <div className="divide-y divide-gray-200">
      {flatFiles.map((file) => (
        <div
          key={file.path}
          className={`flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
            selectedFile === file.path ? 'bg-blue-50 border-l-4 border-blue-500' : ''
          }`}
          onClick={() => onFileSelect(file)}
        >
          <div className="flex items-center flex-1 min-w-0">
            {getFileIcon(file.name)}
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
              <p className="text-xs text-gray-500 truncate">{file.path}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{formatFileSize(file.size)}</span>
            <span>{formatDate(file.lastModified)}</span>
            <span className="capitalize">{file.type}</span>
          </div>
          
          <div className="flex items-center space-x-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFileOperation('edit', file);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFileOperation('download', file);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

// File Tree Node Component
interface FileTreeNodeProps {
  node: FileNode;
  onFileSelect: (file: FileNode) => void;
  onFileOperation: (operation: string, file: FileNode) => void;
  selectedFile?: string;
  expandedFolders: Set<string>;
  onFolderToggle: (path: string) => void;
  getFileIcon: (name: string) => React.ReactNode;
  formatFileSize: (size?: number) => string;
  formatDate: (date?: string) => string;
  level: number;
}

function FileTreeNode({
  node,
  onFileSelect,
  onFileOperation,
  selectedFile,
  expandedFolders,
  onFolderToggle,
  getFileIcon,
  formatFileSize,
  formatDate,
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

  return (
    <div>
      <div
        className={`flex items-center px-3 py-2 rounded-lg text-sm cursor-pointer transition-all duration-200 group ${
          isSelected 
            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={handleClick}
      >
        {node.type === 'directory' ? (
          <>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-2 text-blue-500" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-2 text-blue-500" />
              )
            ) : (
              <div className="w-4 h-4 mr-2" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
            ) : (
              <Folder className="w-4 h-4 mr-2 text-blue-500" />
            )}
          </>
        ) : (
          getFileIcon(node.name)
        )}
        
        <span className="truncate font-medium flex-1">{node.name}</span>
        
        {node.size && (
          <span className="ml-2 text-xs text-gray-400">
            {formatFileSize(node.size)}
          </span>
        )}
        
        {/* File Operations */}
        {node.type === 'file' && (
          <div className="flex items-center space-x-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFileOperation('edit', node);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Edit3 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFileOperation('download', node);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Download className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFileOperation('copy', node);
              }}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
      
      {node.type === 'directory' && isExpanded && node.children && (
        <div className="mt-1">
          {node.children.map((child) => (
            <FileTreeNode
              key={child.path}
              node={child}
              onFileSelect={onFileSelect}
              onFileOperation={onFileOperation}
              selectedFile={selectedFile}
              expandedFolders={expandedFolders}
              onFolderToggle={onFolderToggle}
              getFileIcon={getFileIcon}
              formatFileSize={formatFileSize}
              formatDate={formatDate}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
