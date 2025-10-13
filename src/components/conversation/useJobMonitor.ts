'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { triggerFileRefresh } from '../file-tree/useFileRefresh';

export type JobStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Job {
  id: string;
  userId: string;
  projectId: string;
  type: string;
  status: JobStatus;
  metadata?: any;
  result?: any;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseJobMonitorReturn {
  jobs: { [jobId: string]: Job };
  isMonitoring: boolean;
  startMonitoring: (jobId: string) => void;
  stopMonitoring: (jobId: string) => void;
  getJobStatus: (jobId: string) => JobStatus | null;
  getJobResult: (jobId: string) => any;
  onJobComplete: (jobId: string, callback: (job: Job) => void) => void;
  onJobFailed: (jobId: string, callback: (job: Job) => void) => void;
}

export function useJobMonitor(): UseJobMonitorReturn {
  const [jobs, setJobs] = useState<{ [jobId: string]: Job }>({});
  const [monitoredJobs, setMonitoredJobs] = useState<Set<string>>(new Set());
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const callbacksRef = useRef<{
    complete: { [jobId: string]: Array<(job: Job) => void> };
    failed: { [jobId: string]: Array<(job: Job) => void> };
  }>({
    complete: {},
    failed: {}
  });

  // Fetch job status from backend
  const fetchJobStatus = useCallback(async (jobId: string): Promise<Job | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('[JobMonitor] No auth token available');
        return null;
      }

      const apiUrl = process.env.NEXT_PUBLIC_ORCHESTRATOR_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/jobs/${jobId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error(`[JobMonitor] Failed to fetch job ${jobId}: ${response.status}`);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(`[JobMonitor] Error fetching job ${jobId}:`, error);
      return null;
    }
  }, []);

  // Poll monitored jobs
  const pollJobs = useCallback(async () => {
    if (monitoredJobs.size === 0) return;

    console.log(`[JobMonitor] Polling ${monitoredJobs.size} jobs`);
    
    const updates: { [jobId: string]: Job } = {};
    
    for (const jobId of monitoredJobs) {
      const job = await fetchJobStatus(jobId);
      if (job) {
        const previousJob = jobs[jobId];
        updates[jobId] = job;
        
        // Check for status changes and trigger callbacks
        if (previousJob?.status !== job.status) {
          console.log(`[JobMonitor] Job ${jobId} status changed: ${previousJob?.status} -> ${job.status}`);
          
          if (job.status === 'COMPLETED' && callbacksRef.current.complete[jobId]) {
            callbacksRef.current.complete[jobId].forEach(callback => callback(job));
            
            // Trigger file refresh for file operations
            if (job.type?.startsWith('FILE_')) {
              console.log(`[JobMonitor] Triggering file refresh for completed ${job.type} job`);
              
              const filePath = job.metadata?.filePath || job.metadata?.operations?.[0]?.path;
              const operation = job.type === 'FILE_CREATE' ? 'create' :
                              job.type === 'FILE_DELETE' ? 'delete' : 'update';
              
              triggerFileRefresh(job.projectId, filePath, operation);
            }
          }
          
          if (job.status === 'FAILED' && callbacksRef.current.failed[jobId]) {
            callbacksRef.current.failed[jobId].forEach(callback => callback(job));
          }
          
          // Stop monitoring completed or failed jobs
          if (job.status === 'COMPLETED' || job.status === 'FAILED') {
            setMonitoredJobs(prev => {
              const newSet = new Set(prev);
              newSet.delete(jobId);
              return newSet;
            });
          }
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      setJobs(prev => ({ ...prev, ...updates }));
    }
  }, [monitoredJobs, jobs, fetchJobStatus]);

  // Start polling when we have jobs to monitor
  useEffect(() => {
    if (monitoredJobs.size > 0 && !intervalRef.current) {
      console.log('[JobMonitor] Starting job polling');
      setIsMonitoring(true);
      intervalRef.current = setInterval(pollJobs, 2000); // Poll every 2 seconds
    } else if (monitoredJobs.size === 0 && intervalRef.current) {
      console.log('[JobMonitor] Stopping job polling');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsMonitoring(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setIsMonitoring(false);
      }
    };
  }, [monitoredJobs.size, pollJobs]);

  const startMonitoring = useCallback((jobId: string) => {
    console.log(`[JobMonitor] Starting to monitor job: ${jobId}`);
    setMonitoredJobs(prev => new Set([...prev, jobId]));
  }, []);

  const stopMonitoring = useCallback((jobId: string) => {
    console.log(`[JobMonitor] Stopping monitoring for job: ${jobId}`);
    setMonitoredJobs(prev => {
      const newSet = new Set(prev);
      newSet.delete(jobId);
      return newSet;
    });
    
    // Clean up callbacks
    delete callbacksRef.current.complete[jobId];
    delete callbacksRef.current.failed[jobId];
  }, []);

  const getJobStatus = useCallback((jobId: string): JobStatus | null => {
    return jobs[jobId]?.status || null;
  }, [jobs]);

  const getJobResult = useCallback((jobId: string) => {
    return jobs[jobId]?.result || null;
  }, [jobs]);

  const onJobComplete = useCallback((jobId: string, callback: (job: Job) => void) => {
    if (!callbacksRef.current.complete[jobId]) {
      callbacksRef.current.complete[jobId] = [];
    }
    callbacksRef.current.complete[jobId].push(callback);
  }, []);

  const onJobFailed = useCallback((jobId: string, callback: (job: Job) => void) => {
    if (!callbacksRef.current.failed[jobId]) {
      callbacksRef.current.failed[jobId] = [];
    }
    callbacksRef.current.failed[jobId].push(callback);
  }, []);

  return {
    jobs,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getJobStatus,
    getJobResult,
    onJobComplete,
    onJobFailed
  };
}