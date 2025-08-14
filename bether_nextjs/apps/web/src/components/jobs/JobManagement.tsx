'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Play, 
  Square, 
  RotateCcw, 
  Terminal, 
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  Download,
  Copy,
  Calendar,
  User
} from 'lucide-react';
import { resolveUserName } from '../../utils/userUtils';
import { supabase } from '../../lib/supabase';
import { useToast, ToastContainer } from '../ui/toast';

interface Job {
  id: string;
  projectid: string;
  type: 'SCAFFOLD' | 'EDIT' | 'TEST' | 'DEPLOY';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  prompt?: string;
  output?: string;
  error?: string;
  metadata?: any;
  createdat: string;
  updatedat: string;
  creator?: string;
  updater?: string;
  deleter?: string;
  deletedAt?: string;
}

interface JobManagementProps {
  projectId: string;
  userId: string;
  onJobCreated?: (job: Job) => void;
  onJobUpdated?: (job: Job) => void;
}

export function JobManagement({ projectId, userId, onJobCreated, onJobUpdated }: JobManagementProps) {
  const { toasts, removeToast, success, error, info } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Job creation states
  const [jobType, setJobType] = useState<Job['type']>('SCAFFOLD');
  const [jobPrompt, setJobPrompt] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch jobs
  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/projects/${projectId}/jobs`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data);
        setFilteredJobs(data);
        if (data.length > 0 && !selectedJob) {
          setSelectedJob(data[0]);
        }
      } else {
        console.error('Failed to fetch jobs:', response.status);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new job
  const createJob = async () => {
    try {
      setIsCreatingJob(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/projects/${projectId}/jobs`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          type: jobType, 
          prompt: jobPrompt || undefined 
        })
      });

      if (response.ok) {
        const newJob = await response.json();
        setJobs(prev => [newJob, ...prev]);
        setSelectedJob(newJob);
        setJobPrompt('');
        setShowCreateForm(false);
        onJobCreated?.(newJob);
        success('Job Created', `New ${jobType.toLowerCase()} job has been created successfully`);
      } else {
        const errorText = await response.text();
        error('Job Creation Failed', errorText);
      }
    } catch (error) {
      console.error('Failed to create job:', error);
      error('Job Creation Failed', 'An unexpected error occurred while creating the job');
    } finally {
      setIsCreatingJob(false);
    }
  };

  // Cancel job
  const cancelJob = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        // Update job status locally
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, status: 'CANCELLED' as const } : job
        ));
        onJobUpdated?.(jobs.find(j => j.id === jobId)!);
        success('Job Cancelled', 'The job has been cancelled successfully');
      } else {
        const errorText = await response.text();
        error('Job Cancellation Failed', errorText);
      }
    } catch (error) {
      console.error('Failed to cancel job:', error);
      error('Job Cancellation Failed', 'An unexpected error occurred while cancelling the job');
    }
  };

  // Retry failed job
  const retryJob = async (jobId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`http://localhost:4000/jobs/${jobId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const retriedJob = await response.json();
        setJobs(prev => prev.map(job => 
          job.id === jobId ? retriedJob : job
        ));
        setSelectedJob(retriedJob);
        onJobUpdated?.(retriedJob);
        success('Job Retried', 'The job has been retried successfully');
      } else {
        const errorText = await response.text();
        error('Job Retry Failed', errorText);
      }
    } catch (error) {
      console.error('Failed to retry job:', error);
      error('Job Retry Failed', 'An unexpected error occurred while retrying the job');
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = jobs;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(job => job.status === statusFilter);
    }

    if (typeFilter !== 'ALL') {
      filtered = filtered.filter(job => job.type === typeFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.prompt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, statusFilter, typeFilter, searchTerm]);

  // Auto-refresh running jobs
  useEffect(() => {
    const interval = setInterval(() => {
      const hasRunningJobs = jobs.some(job => job.status === 'RUNNING');
      if (hasRunningJobs) {
        fetchJobs();
      }
    }, 5000); // Refresh every 5 seconds if there are running jobs

    return () => clearInterval(interval);
  }, [jobs]);

  // Initial fetch
  useEffect(() => {
    fetchJobs();
  }, [projectId]);

  const getStatusIcon = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'RUNNING': return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELLED': return <Square className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500';
      case 'RUNNING': return 'bg-blue-500';
      case 'FAILED': return 'bg-red-500';
      case 'CANCELLED': return 'bg-gray-500';
      default: return 'bg-yellow-500';
    }
  };

  const getTypeColor = (type: Job['type']) => {
    switch (type) {
      case 'SCAFFOLD': return 'bg-purple-500';
      case 'EDIT': return 'bg-blue-500';
      case 'TEST': return 'bg-green-500';
      case 'DEPLOY': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadOutput = (job: Job) => {
    const content = job.output || job.error || 'No output available';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${job.id}-${job.type.toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Job Management</h2>
          <p className="text-sm text-gray-600">Manage and monitor project jobs</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRefreshing(true);
              fetchJobs().finally(() => setIsRefreshing(false));
            }}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={() => setShowCreateForm(true)}
            disabled={isCreatingJob}
            className="button-primary"
          >
            <Play className="w-4 h-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      {/* Create Job Form */}
      {showCreateForm && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg">Create New Job</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as Job['type'])}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="SCAFFOLD">Scaffold Project</option>
                <option value="EDIT">Edit Code</option>
                <option value="TEST">Run Tests</option>
                <option value="DEPLOY">Deploy</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prompt (Optional)
              </label>
              <textarea
                value={jobPrompt}
                onChange={(e) => setJobPrompt(e.target.value)}
                placeholder="Describe what you want to do..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={createJob}
                disabled={isCreatingJob}
                className="button-primary"
              >
                {isCreatingJob ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Create Job
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setJobPrompt('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="RUNNING">Running</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="p-1 border border-gray-300 rounded text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="SCAFFOLD">Scaffold</option>
                <option value="EDIT">Edit</option>
                <option value="TEST">Test</option>
                <option value="DEPLOY">Deploy</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 p-1 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job List */}
      <div className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading jobs...</span>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Terminal className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No jobs found</p>
              <p className="text-sm text-gray-400">Create your first job to get started</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto h-full">
            {filteredJobs.map((job) => (
              <Card
                key={job.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  selectedJob?.id === job.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(job.status)}
                      <span className="text-sm font-medium">{job.type}</span>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(job.createdat).toLocaleDateString()}</span>
                      <span>{new Date(job.createdat).toLocaleTimeString()}</span>
                    </div>
                    
                    {job.prompt && (
                      <p className="text-sm text-gray-600 truncate" title={job.prompt}>
                        {job.prompt}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)} text-white`}>
                          {job.type}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {job.status === 'RUNNING' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelJob(job.id);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Square className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {job.status === 'FAILED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              retryJob(job.id);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </Button>
                        )}
                        
                        {(job.output || job.error) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadOutput(job);
                            }}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Job Details */}
      {selectedJob && (
        <Card className="border-t">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Job Details</span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(selectedJob.id)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {(selectedJob.output || selectedJob.error) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => downloadOutput(selectedJob)}
                    className="text-gray-600 hover:text-gray-700"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Job ID:</span>
                <p className="text-gray-600 font-mono">{selectedJob.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedJob.status)}
                  <span className="capitalize">{selectedJob.status.toLowerCase()}</span>
                </div>
              </div>
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(selectedJob.type)} text-white`}>
                  {selectedJob.type}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="text-gray-600">
                  {new Date(selectedJob.createdat).toLocaleString()}
                </p>
              </div>
            </div>
            
            {selectedJob.prompt && (
              <div>
                <span className="font-medium text-gray-700">Prompt:</span>
                <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded">{selectedJob.prompt}</p>
              </div>
            )}
            
            {selectedJob.output && (
              <div>
                <span className="font-medium text-gray-700">Output:</span>
                <div className="mt-1 p-2 bg-gray-900 rounded text-gray-100 text-sm font-mono max-h-40 overflow-auto">
                  <pre className="whitespace-pre-wrap">{selectedJob.output}</pre>
                </div>
              </div>
            )}
            
            {selectedJob.error && (
              <div>
                <span className="font-medium text-gray-700">Error:</span>
                <div className="mt-1 p-2 bg-red-50 rounded text-red-700 text-sm font-mono max-h-40 overflow-auto">
                  <pre className="whitespace-pre-wrap">{selectedJob.error}</pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
