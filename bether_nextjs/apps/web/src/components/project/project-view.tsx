'use client';

import { useState, useEffect } from 'react';
import { Play, Code, TestTube, Rocket } from 'lucide-react';
import { Button } from '../ui/button';
import { FileTree } from '../file-tree/file-tree';
import { JobLogs } from '../jobs/job-logs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { supabase } from '../../lib/supabase';

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
}

interface Job {
  id: string;
  projectId: string;
  type: 'SCAFFOLD' | 'EDIT' | 'TEST' | 'DEPLOY';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  prompt?: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectViewProps {
  project: Project;
  userId: string;
}

// Mock file tree data
const mockFiles = [
  {
    name: 'src',
    type: 'directory' as const,
    path: 'src',
    children: [
      {
        name: 'app',
        type: 'directory' as const,
        path: 'src/app',
        children: [
          { name: 'page.tsx', type: 'file' as const, path: 'src/app/page.tsx' },
          { name: 'layout.tsx', type: 'file' as const, path: 'src/app/layout.tsx' },
        ]
      },
      { name: 'components', type: 'directory' as const, path: 'src/components' },
      { name: 'lib', type: 'directory' as const, path: 'src/lib' },
    ]
  },
  { name: 'package.json', type: 'file' as const, path: 'package.json' },
  { name: 'README.md', type: 'file' as const, path: 'README.md' },
  { name: '.gitignore', type: 'file' as const, path: '.gitignore' },
];

export function ProjectView({ project, userId }: ProjectViewProps) {
  const [selectedFile, setSelectedFile] = useState<string | undefined>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [isJobRunning, setIsJobRunning] = useState(false);

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

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project.repoowner}/{project.reponame} • {project.templatekey}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(project.status)}`} />
            <span className="text-sm text-muted-foreground">{project.status}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* File Tree */}
        <div className="w-64 border-r">
          <FileTree
            files={mockFiles}
            onFileSelect={(file) => setSelectedFile(file.path)}
            selectedFile={selectedFile}
          />
        </div>

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="border-b p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h3 className="font-medium">
                  {selectedFile || 'Select a file'}
                </h3>
              </div>
              
              {/* Job Actions */}
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => createJob('SCAFFOLD')}
                  disabled={isJobRunning}
                >
                  <Code className="w-4 h-4 mr-1" />
                  Scaffold
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createJob('TEST')}
                  disabled={isJobRunning}
                >
                  <TestTube className="w-4 h-4 mr-1" />
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => createJob('DEPLOY')}
                  disabled={isJobRunning}
                >
                  <Rocket className="w-4 h-4 mr-1" />
                  Deploy
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 p-4">
            {selectedFile ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedFile}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded font-mono text-sm">
                    {/* Mock file content */}
                    <div className="text-muted-foreground">
                      // File content would be displayed here
                      // This is a placeholder for the Monaco editor
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file from the tree to view its contents</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Job Logs */}
        <div className="w-96 border-l">
          {currentJob ? (
            <JobLogs
              projectId={project.id}
              jobId={currentJob.id}
              isRunning={isJobRunning}
              onStart={() => setIsJobRunning(true)}
              onStop={() => setIsJobRunning(false)}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No active job</p>
                <p className="text-sm">Start a job to see logs</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Job History */}
      {jobs.length > 0 && (
        <div className="border-t p-4">
          <h3 className="text-sm font-medium mb-2">Recent Jobs</h3>
          <div className="flex space-x-2 overflow-x-auto">
            {jobs.slice(-5).reverse().map((job) => (
              <Card
                key={job.id}
                className={`min-w-48 cursor-pointer transition-colors ${
                  currentJob?.id === job.id ? 'border-primary bg-primary/5' : ''
                }`}
                onClick={() => setCurrentJob(job)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{job.type}</span>
                    <div className={`w-2 h-2 rounded-full ${getJobStatusColor(job.status)}`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(job.createdAt).toLocaleTimeString()}
                  </p>
                  {job.prompt && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
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
