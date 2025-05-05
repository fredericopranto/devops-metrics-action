import dotenv from 'dotenv';

dotenv.config();

export class Logger {
  private static isLoggingEnabled(): boolean {
    return process.env.LOGGING === 'true';
  }

  static info(message: string): void {
    console.log(`[INFO]: ${message}`);
  }

  static error(message: string): void {
    console.error(`[ERROR]: ${message}`);
  }

  static warn(message: string): void {
    console.warn(`[WARN]: ${message}`);
  }

  static debug(message: string): void {
    if (this.isLoggingEnabled()) {
      console.debug(`[DEBUG]: ${message}`);
    }
  }
}