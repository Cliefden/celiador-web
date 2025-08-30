
import { z } from 'zod';

// Job types
export const JobType = z.enum(['SCAFFOLD', 'EDIT', 'TEST', 'DEPLOY', 'AI_ACTION', 'GITHUB_PUSH', 'VERCEL_DEPLOY', 'PREVIEW_DEPLOY']);
export type JobType = z.infer<typeof JobType>;

export const JobStatus = z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export type JobStatus = z.infer<typeof JobStatus>;

// Job data schema
export const JobData = z.object({
  jobId: z.string().optional(), // Added for worker to update job status
  projectId: z.string(),
  userId: z.string(),
  type: JobType,
  prompt: z.string().optional(),
  templateKey: z.string(),
  repo: z.object({
    provider: z.string(),
    owner: z.string(),
    name: z.string()
  }),
  env: z.record(z.string()).optional(),
  metadata: z.any().optional() // For AI_ACTION jobs and other custom data
});

export type JobData = z.infer<typeof JobData>;

// Job result schema
export const JobResult = z.object({
  success: z.boolean(),
  output: z.string().optional(),
  error: z.string().optional(),
  filesCreated: z.array(z.string()).optional(),
  filesModified: z.array(z.string()).optional()
});

export type JobResult = z.infer<typeof JobResult>;

// Log entry schema
export const LogEntry = z.object({
  timestamp: z.string(),
  level: z.enum(['info', 'warn', 'error']),
  message: z.string(),
  data: z.any().optional()
});

export type LogEntry = z.infer<typeof LogEntry>;

// LLM-related schemas
export const LLMMetadata = z.object({
  llmGenerated: z.boolean().optional(),
  filesModified: z.array(z.string()).optional(),
  llmError: z.string().optional(),
  prompt: z.string().optional(),
  testFile: z.string().optional(),
  projectDir: z.string().optional(),
  filesUploaded: z.number().optional(),
  storageLocation: z.string().optional(),
  error: z.string().optional(),
  exitCode: z.number().optional(),
  deployed: z.boolean().optional()
}).passthrough(); // Allow additional properties

export type LLMMetadata = z.infer<typeof LLMMetadata>;

// Integration schemas
export const ProjectIntegration = z.object({
  id: z.string(),
  projectId: z.string(),
  githubEnabled: z.boolean().default(false),
  githubDefaultBranch: z.string().default('main'),
  vercelEnabled: z.boolean().default(false),
  vercelProjectId: z.string().optional(),
  vercelTeamId: z.string().optional(),
  vercelAccessToken: z.string().optional(),
  vercelDomain: z.string().optional(),
  deploymentMode: z.enum(['GITHUB_ONLY', 'SMART_BRANCHING']).default('GITHUB_ONLY'),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type ProjectIntegration = z.infer<typeof ProjectIntegration>;

export const DeploymentHistory = z.object({
  id: z.string(),
  projectId: z.string(),
  type: z.enum(['GITHUB_PUSH', 'VERCEL_DEPLOY', 'PREVIEW_DEPLOY']),
  branch: z.string().optional(),
  commitSha: z.string().optional(),
  vercelUrl: z.string().optional(),
  status: z.enum(['PENDING', 'SUCCESS', 'FAILED']),
  metadata: z.record(z.any()).optional(),
  createdAt: z.date()
});

export type DeploymentHistory = z.infer<typeof DeploymentHistory>;

export const DeploymentAction = z.object({
  type: z.enum(['GITHUB_PUSH', 'VERCEL_DEPLOY', 'PREVIEW_DEPLOY']),
  commitMessage: z.string(),
  branch: z.string().optional(),
  mergeToMain: z.boolean().optional()
});

export type DeploymentAction = z.infer<typeof DeploymentAction>;

// Enhanced job result with LLM metadata
export const EnhancedJobResult = JobResult.extend({
  metadata: LLMMetadata.optional()
});

export type EnhancedJobResult = z.infer<typeof EnhancedJobResult>;

// File storage exports
export { FileStorageService, type FileData, type FileTreeItem } from './storage.js';
