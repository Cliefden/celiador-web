import { PrismaClient } from '@prisma/client';

// Global prisma instance
declare global {
  var __prisma: PrismaClient | undefined;
}

export const prisma = globalThis.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Database service class
export class DatabaseService {
  // User operations
  async createUser(email: string, name?: string) {
    return await prisma.user.create({
      data: { email, name }
    });
  }

  async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    });
  }

  async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        projects: {
          include: {
            jobs: true
          }
        }
      }
    });
  }

  // Project operations
  async createProject(data: {
    name: string;
    templateKey: string;
    repoProvider: string;
    repoOwner: string;
    repoName: string;
    env?: Record<string, string>;
    userId: string;
  }) {
    return await prisma.project.create({
      data: {
        name: data.name,
        templateKey: data.templateKey,
        repoProvider: data.repoProvider,
        repoOwner: data.repoOwner,
        repoName: data.repoName,
        env: data.env ? JSON.stringify(data.env) : null,
        userId: data.userId
      }
    });
  }

  async getProjectById(id: string) {
    return await prisma.project.findUnique({
      where: { id },
      include: {
        user: true,
        jobs: true
      }
    });
  }

  async getProjectsByUserId(userId: string) {
    return await prisma.project.findMany({
      where: { userId },
      include: {
        jobs: true
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateProjectStatus(id: string, status: string) {
    return await prisma.project.update({
      where: { id },
      data: { status }
    });
  }

  // Job operations
  async createJob(data: {
    type: string;
    prompt?: string;
    projectId: string;
    userId: string;
  }) {
    return await prisma.job.create({
      data: {
        type: data.type,
        prompt: data.prompt,
        projectId: data.projectId,
        userId: data.userId
      }
    });
  }

  async getJobById(id: string) {
    return await prisma.job.findUnique({
      where: { id },
      include: {
        project: true,
        user: true
      }
    });
  }

  async getJobsByProjectId(projectId: string) {
    return await prisma.job.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateJobStatus(id: string, status: string, output?: string, error?: string, metadata?: any) {
    return await prisma.job.update({
      where: { id },
      data: {
        status,
        output,
        error,
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    });
  }
}

export const db = new DatabaseService();
