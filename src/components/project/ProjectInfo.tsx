'use client';

import { useState, useEffect } from 'react';
import { resolveUserName } from '../../utils/userUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  User, 
  Calendar, 
  GitBranch, 
  Code, 
  Clock,
  Edit,
  Trash2
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

interface ProjectInfoProps {
  project: Project;
  onDelete?: (projectId: string) => void;
}

export function ProjectInfo({ project, onDelete }: ProjectInfoProps) {
  const [creatorName, setCreatorName] = useState<string>('Loading...');
  const [updaterName, setUpdaterName] = useState<string>('Loading...');
  const [deleterName, setDeleterName] = useState<string>('');

  useEffect(() => {
    const resolveNames = async () => {
      console.log('ProjectInfo: Resolving names for project:', project);
      console.log('Creator ID:', project.creator);
      console.log('Updater ID:', project.updater);
      console.log('Deleter ID:', project.deleter);

      if (project.creator) {
        const name = await resolveUserName(project.creator);
        setCreatorName(name);
      } else {
        console.log('No creator ID found');
        setCreatorName('Unknown');
      }

      if (project.updater) {
        const name = await resolveUserName(project.updater);
        setUpdaterName(name);
      } else {
        console.log('No updater ID found');
        setUpdaterName('Unknown');
      }

      if (project.deleter) {
        const name = await resolveUserName(project.deleter);
        setDeleterName(name);
      }
    };

    resolveNames();
  }, [project]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ready':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Project Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Template</p>
              <p className="font-medium">{project.templatekey}</p>
            </div>
          </div>

          {/* Repository Info */}
          {project.repoowner && project.reponame && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <GitBranch className="w-4 h-4" />
              <span>{project.repoowner}/{project.reponame}</span>
              <span className="text-gray-400">({project.repoprovider})</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Project History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Created */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Created</p>
                <p className="text-sm text-gray-600">{formatDate(project.createdat)}</p>
                <p className="text-xs text-gray-500">by {creatorName}</p>
              </div>
            </div>

            {/* Updated */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Edit className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-600">{formatDate(project.updatedat)}</p>
                <p className="text-xs text-gray-500">by {updaterName}</p>
              </div>
            </div>
          </div>

          {/* Deleted (if applicable) */}
          {project.deletedAt && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Deleted</p>
                <p className="text-sm text-gray-600">{formatDate(project.deletedAt)}</p>
                <p className="text-xs text-gray-500">by {deleterName}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Project */}
      {onDelete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Delete Project</p>
                <p className="text-sm text-gray-600">This action cannot be undone. All project data will be permanently deleted.</p>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
                    onDelete(project.id);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete Project
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
