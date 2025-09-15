'use client';

import { useState, useEffect } from 'react';
import { resolveUserName } from '../../utils/userUtils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { 
  User, 
  Calendar, 
  Play, 
  Clock,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Square
} from 'lucide-react';

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

interface JobInfoProps {
  job: Job;
}

export function JobInfo({ job }: JobInfoProps) {
  const [creatorName, setCreatorName] = useState<string>('Loading...');
  const [updaterName, setUpdaterName] = useState<string>('Loading...');
  const [deleterName, setDeleterName] = useState<string>('');

  useEffect(() => {
    const resolveNames = async () => {
      if (job.creator) {
        const name = await resolveUserName(job.creator);
        setCreatorName(name);
      } else {
        setCreatorName('Unknown');
      }

      if (job.updater) {
        const name = await resolveUserName(job.updater);
        setUpdaterName(name);
      } else {
        setUpdaterName('Unknown');
      }

      if (job.deleter) {
        const name = await resolveUserName(job.deleter);
        setDeleterName(name);
      }
    };

    resolveNames();
  }, [job]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'running':
        return 'text-blue-600 bg-blue-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'cancelled':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <Square className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'scaffold':
        return 'text-purple-600 bg-purple-100';
      case 'edit':
        return 'text-blue-600 bg-blue-100';
      case 'test':
        return 'text-orange-600 bg-orange-100';
      case 'deploy':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="w-5 h-5" />
          Job Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Job Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{job.type}</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusIcon(job.status)}
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                {job.status}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(job.type)}`}>
              {job.type}
            </span>
          </div>
        </div>

        {/* Prompt */}
        {job.prompt && (
          <div>
            <p className="text-sm font-medium text-gray-900 mb-1">Prompt</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              {job.prompt}
            </p>
          </div>
        )}

        {/* Job History */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <User className="w-4 h-4" />
            Job History
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Created */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-3 h-3 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Created</p>
                <p className="text-xs text-gray-600">{formatDate(job.createdat)}</p>
                <p className="text-xs text-gray-500">by {creatorName}</p>
              </div>
            </div>

            {/* Updated */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <Edit className="w-3 h-3 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Last Updated</p>
                <p className="text-xs text-gray-600">{formatDate(job.updatedat)}</p>
                <p className="text-xs text-gray-500">by {updaterName}</p>
              </div>
            </div>
          </div>

          {/* Deleted (if applicable) */}
          {job.deletedAt && (
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-3 h-3 text-red-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Deleted</p>
                <p className="text-xs text-gray-600">{formatDate(job.deletedAt)}</p>
                <p className="text-xs text-gray-500">by {deleterName}</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
