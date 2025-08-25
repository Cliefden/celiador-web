'use client';

import { useState, useEffect } from 'react';
import { 
  Save, 
  Download, 
  Copy, 
  RotateCcw, 
  Eye, 
  Edit3,
  FileText,
  Code,
  Image,
  FileCode,
  FileJson,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useToast, ToastContainer } from '../ui/toast';

interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  size?: number;
  children?: FileNode[];
  lastModified?: string;
  permissions?: string;
}

interface FileEditorProps {
  file: FileNode | null;
  content: string;
  onSave?: (content: string) => Promise<void>;
  onDownload?: (file: FileNode) => void;
  onClose?: () => void;
  isReadOnly?: boolean;
  className?: string;
}

export function FileEditor({ 
  file, 
  content, 
  onSave, 
  onDownload, 
  onClose,
  isReadOnly = false,
  className = ""
}: FileEditorProps) {
  const { toasts, removeToast, success, error, info } = useToast();
  
  // Gentle debugging
  useEffect(() => {
    console.log('[FileEditor] File prop:', file);
    console.log('[FileEditor] Content length:', content?.length || 0);
  }, [file, content]);
  const [editedContent, setEditedContent] = useState(content);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditedContent(content);
    setHasChanges(false);
    setIsEditing(false);
  }, [content, file]);

  const handleContentChange = (newContent: string) => {
    setEditedContent(newContent);
    setHasChanges(newContent !== content);
  };

  const handleSave = async () => {
    if (!onSave || !hasChanges) return;
    
    try {
      console.log('[FileEditor] Starting save operation...');
      setIsSaving(true);
      await onSave(editedContent);
      console.log('[FileEditor] Save operation completed successfully');
      setHasChanges(false);
      success('File Saved', `${file?.name} has been saved successfully`);
    } catch (err) {
      console.error('[FileEditor] Save operation failed:', err);
      error('Save Failed', 'Failed to save the file');
    } finally {
      console.log('[FileEditor] Setting isSaving to false');
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setEditedContent(content);
    setHasChanges(false);
    setIsEditing(false);
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(editedContent);
      success('Content Copied', 'File content copied to clipboard');
    } catch (err) {
      error('Copy Failed', 'Failed to copy content to clipboard');
    }
  };

  const handleDownload = () => {
    if (onDownload && file) {
      onDownload(file);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
        return <FileCode className="w-5 h-5 text-yellow-500" />;
      case 'json':
        return <FileJson className="w-5 h-5 text-green-500" />;
      case 'html':
      case 'htm':
        return <FileCode className="w-5 h-5 text-orange-500" />;
      case 'css':
      case 'scss':
      case 'sass':
        return <FileCode className="w-5 h-5 text-blue-500" />;
      case 'md':
      case 'txt':
        return <FileText className="w-5 h-5 text-gray-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FileImage className="w-5 h-5 text-purple-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <FileVideo className="w-5 h-5 text-red-500" />;
      case 'mp3':
      case 'wav':
        return <FileAudio className="w-5 h-5 text-green-500" />;
      case 'pdf':
        return <File className="w-5 h-5 text-red-500" />;
      case 'zip':
      case 'tar':
      case 'gz':
        return <File className="w-5 h-5 text-orange-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileType = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? extension.toUpperCase() : 'FILE';
  };

  const isImageFile = (fileName: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? imageExtensions.includes(extension) : false;
  };

  const isTextFile = (fileName: string) => {
    const textExtensions = [
      'txt', 'md', 'js', 'jsx', 'ts', 'tsx', 'html', 'htm', 'css', 'scss', 'sass',
      'json', 'xml', 'yaml', 'yml', 'csv', 'sql', 'py', 'java', 'cpp', 'c', 'php',
      'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'r', 'm', 'sh', 'bash', 'zsh',
      'config', 'env', 'ini', 'toml', 'lock', 'log'
    ];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? textExtensions.includes(extension) : false;
  };

  const isBinaryFile = (fileName: string) => {
    return !isTextFile(fileName) && !isImageFile(fileName);
  };

  if (!file) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No File Selected</h3>
          <p className="text-gray-500">Select a file from the tree to view its contents</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getFileIcon(file.name)}
              <div>
                <CardTitle className="text-lg">{file.name}</CardTitle>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{file.path}</span>
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {getFileType(file.name)}
                  </span>
                  {file.size && (
                    <span>{file.size > 1024 ? `${(file.size / 1024).toFixed(1)}KB` : `${file.size}B`}</span>
                  )}
                  {file.lastModified && (
                    <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {!isReadOnly && (
                <>
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                        disabled={isSaving}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {isSaving ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                </>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyContent}
                className="text-gray-600 hover:text-gray-900"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="text-gray-600 hover:text-gray-900"
              >
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
              
              {onClose && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      <Card className="flex-1 overflow-hidden">
        <CardContent className="p-0 h-full">
          <div className="h-full overflow-auto">
            {isImageFile(file.name) ? (
              <div className="flex items-center justify-center h-full p-4">
                <img
                  src={`data:image/${file.name.split('.').pop()};base64,${btoa(editedContent)}`}
                  alt={file.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : isBinaryFile(file.name) ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Binary File</h3>
                  <p className="text-gray-500">This file type cannot be displayed in the editor</p>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="relative h-full">
                {isEditing ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-full p-4 font-mono text-sm border-0 focus:ring-0 resize-none"
                    placeholder="File content..."
                    spellCheck={false}
                  />
                ) : (
                  <pre className="w-full h-full p-4 font-mono text-sm overflow-auto whitespace-pre-wrap">
                    {editedContent}
                  </pre>
                )}
                
                {/* Line Numbers (for read-only view) */}
                {!isEditing && (
                  <div className="absolute left-0 top-0 w-12 h-full bg-gray-50 border-r border-gray-200 text-xs text-gray-500 font-mono">
                    {editedContent.split('\n').map((_, index) => (
                      <div key={index} className="px-2 py-1 text-right">
                        {index + 1}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Bar */}
      {isEditing && (
        <div className="mt-2 text-xs text-gray-500 flex items-center justify-between">
          <span>
            {hasChanges ? 'Modified' : 'Saved'} • {editedContent.length} characters
          </span>
          <span>
            {editedContent.split('\n').length} lines
          </span>
        </div>
      )}
    </div>
  );
}
