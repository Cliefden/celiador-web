import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PortManager {
  private static readonly PORT_RANGE_START = 8000;
  private static readonly PORT_RANGE_END = 9000;
  private allocatedPorts = new Set<number>();

  /**
   * Find an available port in the range
   */
  async allocatePort(): Promise<number> {
    for (let port = PortManager.PORT_RANGE_START; port <= PortManager.PORT_RANGE_END; port++) {
      if (!this.allocatedPorts.has(port) && await this.isPortAvailable(port)) {
        this.allocatedPorts.add(port);
        return port;
      }
    }
    throw new Error('No available ports in range');
  }

  /**
   * Release a port back to the pool
   */
  releasePort(port: number): void {
    this.allocatedPorts.delete(port);
  }

  /**
   * Check if a port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`lsof -i :${port}`);
      return !stdout.trim(); // If no output, port is available
    } catch (error) {
      // If lsof command fails, assume port is available
      return true;
    }
  }

  /**
   * Kill process on port if exists
   */
  async killProcessOnPort(port: number): Promise<void> {
    try {
      const { stdout } = await execAsync(`lsof -t -i :${port}`);
      const pids = stdout.trim().split('\n').filter(Boolean);
      
      for (const pid of pids) {
        try {
          await execAsync(`kill -9 ${pid}`);
          console.log(`[PortManager] Killed process ${pid} on port ${port}`);
        } catch (error) {
          console.warn(`[PortManager] Failed to kill process ${pid}:`, error);
        }
      }
    } catch (error) {
      // No process running on port, which is fine
    }
  }

  /**
   * Get all allocated ports
   */
  getAllocatedPorts(): number[] {
    return Array.from(this.allocatedPorts);
  }
}

// Singleton instance
export const portManager = new PortManager();