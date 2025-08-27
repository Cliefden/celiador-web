'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { JobManagement } from '../../../components/jobs/JobManagement';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { 
  Filter, 
  Search, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Square,
  Play,
  RotateCcw
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

export default function JobsPage() {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [allJobs, setAllJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>('ALL');

  // Handle URL parameters for project filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const projectParam = urlParams.get('project');
    if (projectParam) {
      setSelectedProject(projectParam);
    }
  }, []);
  const [isLoadingJobs, setIsLoadingJobs] = useState(true);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/');
    }
  }, [user, isLoading, router]);

  // Fetch projects and jobs
  useEffect(() => {
    if (user) {
      fetchProjectsAndJobs();
    }
  }, [user]);

  const fetchProjectsAndJobs = async () => {
    try {
      setIsLoadingJobs(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // Fetch projects
      const projectsResponse = await fetch('http://localhost:4000/projects', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json();
        setProjects(projectsData);

        // Fetch jobs for all projects
        const allJobsData: Job[] = [];
        for (const project of projectsData) {
          const jobsResponse = await fetch(`http://localhost:4000/projects/${project.id}/jobs`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });

          if (jobsResponse.ok) {
            const jobsData = await jobsResponse.json();
            // Add project info to each job
            const jobsWithProject = jobsData.map((job: Job) => ({
              ...job,
              projectName: project.name,
              projectTemplate: project.templatekey
            }));
            allJobsData.push(...jobsWithProject);
          }
        }

        // Sort by creation date (newest first)
        allJobsData.sort((a, b) => new Date(b.createdat).getTime() - new Date(a.createdat).getTime());
        setAllJobs(allJobsData);
        setFilteredJobs(allJobsData);
      }
    } catch (error) {
      console.error('Failed to fetch projects and jobs:', error);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let filtered = allJobs;

    if (selectedProject !== 'ALL') {
      filtered = filtered.filter(job => job.projectid === selectedProject);
    }

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
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job as any).projectName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(job => {
        const jobDate = new Date(job.createdat);
        switch (dateFilter) {
          case 'TODAY':
            return jobDate >= today;
          case 'YESTERDAY':
            return jobDate >= yesterday && jobDate < today;
          case 'LAST_WEEK':
            return jobDate >= lastWeek;
          case 'LAST_MONTH':
            return jobDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    setFilteredJobs(filtered);
  }, [allJobs, selectedProject, statusFilter, typeFilter, searchTerm, dateFilter]);

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

  const getJobStats = () => {
    const total = allJobs.length;
    const completed = allJobs.filter(job => job.status === 'COMPLETED').length;
    const running = allJobs.filter(job => job.status === 'RUNNING').length;
    const failed = allJobs.filter(job => job.status === 'FAILED').length;
    const pending = allJobs.filter(job => job.status === 'PENDING').length;

    return { total, completed, running, failed, pending };
  };

  const stats = getJobStats();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">B</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Bether Studio
                </span>
              </div>
              
              {/* Dashboard Navigation */}
              <nav className="hidden md:flex space-x-6">
                <a href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Dashboard
                </a>
                <a href="/dashboard/jobs" className="text-blue-600 font-medium px-3 py-2 text-sm">
                  Jobs
                </a>
                <a href="/solutions" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Solutions
                </a>
                <a href="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  About Us
                </a>
                <a href="/contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200">
                  Contact
                </a>
              </nav>
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">
                  {profile?.full_name || profile?.username || user?.email || 'User'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {profile?.role || 'user'}
                </p>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">
                  {(profile?.full_name || profile?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
                title="Refresh page"
              >
                ↻
              </button>
              <button
                onClick={signOut}
                className="text-gray-700 hover:text-red-600 px-3 py-2 text-sm font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Job Management</h1>
          <p className="text-gray-600">Monitor and manage all project jobs</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Jobs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Running</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.running}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4 flex-wrap">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="ALL">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
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
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="ALL">All Types</option>
                  <option value="SCAFFOLD">Scaffold</option>
                  <option value="EDIT">Edit</option>
                  <option value="TEST">Test</option>
                  <option value="DEPLOY">Deploy</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="p-2 border border-gray-300 rounded text-sm"
                >
                  <option value="ALL">All Time</option>
                  <option value="TODAY">Today</option>
                  <option value="YESTERDAY">Yesterday</option>
                  <option value="LAST_WEEK">Last Week</option>
                  <option value="LAST_MONTH">Last Month</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 flex-1">
                <Search className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Jobs List */}
        <div className="space-y-4">
          {isLoadingJobs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading jobs...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <Card className="glass">
              <CardContent className="p-12 text-center">
                <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-500">Try adjusting your filters or create a new job</p>
              </CardContent>
            </Card>
          ) : (
            filteredJobs.map((job) => (
              <Card key={job.id} className="glass hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getStatusIcon(job.status)}
                        <div>
                          <h3 className="font-medium text-gray-900">{job.type}</h3>
                          <p className="text-sm text-gray-600">
                            {(job as any).projectName || 'Unknown Project'}
                          </p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`} />
                      </div>
                      
                      {job.prompt && (
                        <p className="text-gray-600 mb-3 line-clamp-2">{job.prompt}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(job.createdat).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(job.createdat).toLocaleTimeString()}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)} text-white`}>
                          {job.type}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/dashboard/projects/${job.projectid}`)}
                      >
                        View Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
