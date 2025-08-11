// Simple database service that works without Prisma
// This will be replaced with actual Prisma client when Supabase is configured

export class DatabaseService {
  // User operations
  async createUser(email: string, name?: string) {
    console.log('DatabaseService: createUser called (not implemented)');
    return { id: 'temp-user-id', email, name };
  }

  async getUserByEmail(email: string) {
    console.log('DatabaseService: getUserByEmail called (not implemented)');
    return null;
  }

  async getUserById(id: string) {
    console.log('DatabaseService: getUserById called (not implemented)');
    return null;
  }

  // Project operations
  async createProject(data: {
    name: string;
    templateKey: string;
    repoProvider: string;
    repoOwner: string;
    repoName: string;
    env?: Record<string, any>;
    userId: string;
  }) {
    console.log('DatabaseService: createProject called (not implemented)');
    return { id: 'temp-project-id', ...data };
  }

  async getProjectById(id: string) {
    console.log('DatabaseService: getProjectById called (not implemented)');
    return null;
  }

  async getProjectsByUserId(userId: string) {
    console.log('DatabaseService: getProjectsByUserId called (not implemented)');
    return [];
  }

  async updateProjectStatus(id: string, status: string) {
    console.log('DatabaseService: updateProjectStatus called (not implemented)');
    return null;
  }

  // Job operations
  async createJob(data: {
    type: string;
    prompt?: string;
    projectId: string;
    userId: string;
  }) {
    console.log('DatabaseService: createJob called (not implemented)');
    return { id: 'temp-job-id', ...data };
  }

  async getJobById(id: string) {
    console.log('DatabaseService: getJobById called (not implemented)');
    return null;
  }

  async getJobsByProjectId(projectId: string) {
    console.log('DatabaseService: getJobsByProjectId called (not implemented)');
    return [];
  }

  async updateJobStatus(id: string, status: string, output?: string, error?: string, metadata?: any) {
    console.log('DatabaseService: updateJobStatus called (not implemented)');
    return null;
  }
}

export const db = new DatabaseService();
