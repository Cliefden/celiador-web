import { spawn, SpawnOptions } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';

export type RunResult = { exitCode: number, stdout: string, stderr: string };

export const tools = {
  async writeFile(path: string, content: string) {
    try {
      await fs.writeFile(path, content, 'utf8');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async patchFile(path: string, unifiedDiff: string) {
    try {
      // For now, just write the diff to a .patch file
      const patchPath = `${path}.patch`;
      await fs.writeFile(patchPath, unifiedDiff, 'utf8');
      return { ok: true, patchPath };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async readFile(path: string) {
    try {
      const content = await fs.readFile(path, 'utf8');
      return { content };
    } catch (error) {
      return { content: '', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async listFiles(glob?: string) {
    try {
      // For now, just list files in current directory
      const files = await fs.readdir('.');
      return { files };
    } catch (error) {
      return { files: [], error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async runCmd(cmd: string, args: string[] = [], options: SpawnOptions = {}): Promise<RunResult> {
    return new Promise((resolve) => {
      const child = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout,
          stderr
        });
      });

      child.on('error', (error) => {
        resolve({
          exitCode: 1,
          stdout,
          stderr: error.message
        });
      });
    });
  },

  async createBranch(name: string, from?: string, options: SpawnOptions = {}) {
    try {
      const args = from ? ['checkout', '-b', name, from] : ['checkout', '-b', name];
      const result = await this.runCmd('git', args, options);
      return { ok: result.exitCode === 0, error: result.stderr };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async openPR(title: string, body: string, fromBranch: string, toBranch: string) {
    // For now, just return a mock PR URL
    return { url: 'https://example.com/pr/1', number: 1 };
  },

  async commentOnPR(number: number, body: string) {
    // For now, just return success
    return { ok: true };
  }
};
