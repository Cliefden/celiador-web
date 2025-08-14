'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileExplorer } from '../file-tree/FileExplorer';
import { FileEditor } from '../file-tree/FileEditor';
import { JobLogs } from '../jobs/job-logs';
import { ProjectInfo } from './ProjectInfo';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  Code, 
  TestTube, 
  Rocket, 
  Play, 
  Square, 
  RotateCcw, 
  FileText, 
  Folder,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Project {
  id: string;
  name: string;
  status: string;
  templatekey: string;
  repoprovider: string;
  repoowner: string;
  reponame: string;
  createdat: string;
  updatedat: string;
  creator?: string;
  updater?: string;
  deleter?: string;
  deletedAt?: string;
}

interface Job {
  id: string;
  projectid: string;
  type: 'SCAFFOLD' | 'EDIT' | 'TEST' | 'DEPLOY';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  prompt?: string;
  createdat: string;
  updatedat: string;
  creator?: string;
  updater?: string;
  deleter?: string;
  deletedAt?: string;
}

interface ProjectViewProps {
  project: Project;
  userId: string;
  onProjectDeleted?: (projectId: string) => void;
}

// File tree interface
interface FileTreeItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileTreeItem[];
}

export function ProjectView({ project, userId, onProjectDeleted }: ProjectViewProps) {
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [selectedFileContent, setSelectedFileContent] = useState<string>('');
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isJobRunning, setIsJobRunning] = useState(false);
  const [fileTree, setFileTree] = useState<FileTreeItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch project jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        const response = await fetch(`http://localhost:4000/projects/${project.id}/jobs`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setJobs(data);
        }
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
      }
    };

    fetchJobs();
  }, [project.id]);

  // Delete project function
  const handleDeleteProject = async (projectId: string) => {
    setIsDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Authentication required');
        return;
      }

      const response = await fetch(`http://localhost:4000/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        onProjectDeleted?.(projectId);
      } else {
        const error = await response.text();
        alert(`Failed to delete project: ${error}`);
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchFileTree = async () => {
    try {
      setIsLoadingFiles(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log(`[web] Fetching file tree for project ${project.id}`);
      const response = await fetch(`http://localhost:4000/projects/${project.id}/files/tree`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      console.log(`[web] File tree response status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[web] File tree data:`, data);
        setFileTree(data.tree || []);
      } else if (response.status === 404) {
        // No files yet, that's okay
        console.log(`[web] No files found (404)`);
        setFileTree([]);
      } else {
        const errorText = await response.text();
        console.error(`[web] File tree error: ${response.status} - ${errorText}`);
        setFileTree([]);
      }
    } catch (error) {
      console.error('Failed to fetch file tree:', error);
      setFileTree([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Fetch project file tree
  useEffect(() => {
    fetchFileTree();
  }, [project.id]);

  const fetchFileContent = async (filePath: string) => {
    try {
      setIsLoadingFileContent(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log(`[web] Fetching file content for: ${filePath}`);
      const response = await fetch(`http://localhost:4000/projects/${project.id}/files/${filePath}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      console.log(`[web] File content response status: ${response.status}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`[web] File content data:`, data);
        setSelectedFileContent(data.file.content || '');
      } else {
        const errorText = await response.text();
        console.error(`[web] File content error: ${response.status} - ${errorText}`);
        setSelectedFileContent('Error loading file content');
      }
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      setSelectedFileContent('Error loading file content');
    } finally {
      setIsLoadingFileContent(false);
    }
  };

  const handleFileSelect = (file: FileTreeItem) => {
    setSelectedFile(file.path);
    if (file.type === 'file') {
      fetchFileContent(file.path);
    }
  };

  const handleFileSave = async (content: string) => {
    if (!selectedFile) return;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      console.log(`[web] Saving file: ${selectedFile}, content length: ${content.length}`);
      console.log(`[web] Project ID: ${project.id}`);
      console.log(`[web] User ID: ${session.user.id}`);
      console.log(`[web] File path: ${selectedFile}`);
      console.log(`[web] URL: http://localhost:4000/projects/${project.id}/files/${selectedFile}`);
      const response = await fetch(`http://localhost:4000/projects/${project.id}/files/save`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filePath: selectedFile, content }),
      });

      console.log(`[web] Save response status: ${response.status}`);
      if (response.ok) {
        const result = await response.json();
        console.log(`[web] Save response:`, result);
        setSelectedFileContent(content);
        // Refresh file tree to show updated file
        fetchFileTree();
      } else {
        const errorText = await response.text();
        console.error(`[web] Save error: ${response.status} - ${errorText}`);
        throw new Error(`Failed to save file: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };

  const handleFileDelete = async (file: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/projects/${project.id}/files/${file.path}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Refresh file tree
        fetchFileTree();
        // Clear selected file if it was deleted
        if (selectedFile === file.path) {
          setSelectedFile(undefined);
          setSelectedFileContent('');
        }
      } else {
        throw new Error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const content = await file.text();
      const response = await fetch(`http://localhost:4000/projects/${project.id}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileName: file.name,
          content,
          path: '', // Upload to root directory
        }),
      });

      if (response.ok) {
        // Refresh file tree
        fetchFileTree();
      } else {
        throw new Error('Failed to upload file');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  };

  const handleFileDownload = async (file: any) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/projects/${project.id}/files/${file.path}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.file.content], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  };

  const createJob = async (type: Job['type'], prompt?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/projects/${project.id}/jobs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ type, prompt })
      });

      if (response.ok) {
        const newJob = await response.json();
        setJobs(prev => [...prev, newJob]);
        setCurrentJob(newJob);
        setIsJobRunning(true);
      }
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-green-500';
      case 'RUNNING': return 'bg-yellow-500';
      case 'FAILED': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getJobStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'RUNNING': return 'bg-yellow-500';
      case 'FAILED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getJobStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4" />;
      case 'RUNNING': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4" />;
      case 'CANCELLED': return <Square className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Project Header */}
      <div className="glass border-b border-gray-200/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <Code className="w-4 h-4" />
                <span>{project.templatekey}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Folder className="w-4 h-4" />
                <span>{project.repoowner}/{project.reponame}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(project.status)}`} />
                <span className="capitalize">{project.status.toLowerCase()}</span>
              </div>
            </div>
          </div>
          
          {/* Job Actions */}
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => createJob('SCAFFOLD')}
              disabled={isJobRunning}
              className="button-primary"
            >
              <Code className="w-4 h-4 mr-2" />
              Scaffold
            </Button>
            <Button
              onClick={() => createJob('TEST')}
              disabled={isJobRunning}
              variant="outline"
              className="button-secondary"
            >
              <TestTube className="w-4 h-4 mr-2" />
              Test
            </Button>
            <Button
              onClick={() => createJob('DEPLOY')}
              disabled={isJobRunning}
              variant="outline"
              className="button-secondary"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Deploy
            </Button>
          </div>
        </div>
      </div>

      {/* Project Information */}
      <div className="glass border-b border-gray-200/50 p-6">
                      <ProjectInfo project={project} onDelete={handleDeleteProject} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* File Explorer */}
        <div className="w-80 bg-white/70 backdrop-blur-sm border-r border-gray-200/50">
          <FileExplorer
            files={fileTree}
            onFileSelect={handleFileSelect}
            onFileEdit={(file) => handleFileSelect(file)}
            onFileDelete={handleFileDelete}
            onFileUpload={handleFileUpload}
            onFileDownload={handleFileDownload}
            selectedFile={selectedFile}
            projectId={project.id}
            className="h-full"
          />
        </div>

        {/* File Editor */}
        <div className="flex-1 flex flex-col">
          <FileEditor
            file={selectedFile ? {
              name: selectedFile.split('/').pop() || selectedFile,
              type: 'file',
              path: selectedFile,
              size: selectedFileContent?.length
            } : null}
            content={selectedFileContent || ''}
            onSave={handleFileSave}
            onDownload={handleFileDownload}
            isReadOnly={false}
            className="h-full"
          />
        </div>

        {/* Job Logs */}
        <div className="w-96 bg-white/70 backdrop-blur-sm border-l border-gray-200/50">
          <div className="p-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Job Logs</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {currentJob ? (
              <JobLogs
                projectId={project.id}
                jobId={currentJob.id}
                isRunning={isJobRunning}
                onStart={() => setIsJobRunning(true)}
                onStop={() => setIsJobRunning(false)}
              />
            ) : (
              <div className="flex items-center justify-center flex-1">
                <div className="text-center">
                  <Play className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No active job</p>
                  <p className="text-sm text-gray-400">Start a job to see logs</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Job History */}
      {jobs.length > 0 && (
        <div className="glass border-t border-gray-200/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900">Recent Jobs</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/dashboard/jobs?project=${project.id}`, '_blank')}
              className="text-blue-600 hover:text-blue-700"
            >
              View All Jobs
            </Button>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-2">
            {jobs.slice(-5).reverse().map((job) => (
              <Card
                key={job.id}
                className={`min-w-48 cursor-pointer transition-all duration-200 card-hover ${
                  currentJob?.id === job.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setCurrentJob(job)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getJobStatusIcon(job.status)}
                      <span className="text-sm font-medium">{job.type}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getJobStatusColor(job.status)}`} />
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(job.createdat).toLocaleTimeString()}
                  </p>
                  {job.prompt && (
                    <p className="text-xs text-gray-400 mt-1 truncate">
                      {job.prompt}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
