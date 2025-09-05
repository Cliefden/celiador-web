export interface ProjectCommand {
  id: string;
  created_at: string;
  creator?: string;
  updater?: string;
  updated_at?: string;
  deleter?: string;
  deleted_at?: string;
  
  project_id: string;
  command_text: string;
  command_type: 'text' | 'voice' | 'generated';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  response?: string;
  executed_at?: string;
}

export interface CreateProjectCommandData {
  project_id: string;
  command_text: string;
  command_type?: 'text' | 'voice' | 'generated';
  status?: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface UpdateProjectCommandData {
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  response?: string;
  executed_at?: string;
}