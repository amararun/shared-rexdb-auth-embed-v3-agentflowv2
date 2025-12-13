type LogLevel = 'info' | 'error' | 'warn';

export type LogEntry = {
  timestamp: string;
  level: LogLevel;
  message: string;
};

class LogService {
  private static instance: LogService;
  private logs: LogEntry[] = [];
  private subscribers: ((logs: LogEntry[]) => void)[] = [];
  private originalConsole: any;

  private constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      error: console.error.bind(console),
      warn: console.warn.bind(console),
    };

    // Override console methods
    console.log = (...args: any[]) => {
      this.originalConsole.log(...args);
      this.addLog('info', args);
    };

    console.error = (...args: any[]) => {
      this.originalConsole.error(...args);
      this.addLog('error', args);
    };

    console.warn = (...args: any[]) => {
      this.originalConsole.warn(...args);
      this.addLog('warn', args);
    };
  }

  public static getInstance(): LogService {
    if (!LogService.instance) {
      LogService.instance = new LogService();
    }
    return LogService.instance;
  }

  private addLog(level: LogLevel, args: any[]): void {
    const message = args
      .map(arg => {
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return String(arg);
        }
      })
      .join(' ');

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    this.logs.push(logEntry);
    // Keep only the last 1000 logs
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Notify subscribers immediately
    requestAnimationFrame(() => {
      this.notifySubscribers();
    });
  }

  public subscribe(callback: (logs: LogEntry[]) => void): () => void {
    this.subscribers.push(callback);
    // Send initial logs immediately
    callback([...this.logs]);
    
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  private notifySubscribers(): void {
    const currentLogs = [...this.logs];
    this.subscribers.forEach(callback => {
      try {
        callback(currentLogs);
      } catch (error) {
        this.originalConsole.error('Error in log subscriber:', error);
      }
    });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.notifySubscribers();
  }

  // Custom logger methods that always feed logs tab but respect Vite console stripping
  public log(level: LogLevel, ...args: any[]): void {
    // Always add to logs tab (not stripped by Vite)
    this.addLog(level, args);
    
    // Only call browser console in development
    if (import.meta.env.DEV) {
      this.originalConsole[level === 'info' ? 'log' : level](...args);
    }
  }

  public info(...args: any[]): void {
    this.log('info', ...args);
  }

  public error(...args: any[]): void {
    this.log('error', ...args);
  }

  public warn(...args: any[]): void {
    this.log('warn', ...args);
  }
}

export const logService = LogService.getInstance(); 