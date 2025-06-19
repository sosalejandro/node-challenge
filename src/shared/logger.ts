import pino from 'pino';

export interface ILogger {
    info(message: string, meta?: any): void;
    error(message: string, meta?: any): void;
}


export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: { colorize: true }
    }
});
