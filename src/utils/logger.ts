export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

interface LogMetadata {
  [key: string]: any;
}

function formatLog(
  level: LogLevel,
  message: string,
  metadata?: LogMetadata
): string {
  const timestamp = new Date().toISOString();
  let log = `[${timestamp}] [${level}] ${message}`;

  if (metadata) {
    log += '\n' + JSON.stringify(metadata, null, 2);
  }

  return log;
}

export function logInfo(message: string, metadata?: LogMetadata): void {
  console.log(formatLog(LogLevel.INFO, message, metadata));
}

export function logWarn(message: string, metadata?: LogMetadata): void {
  console.warn(formatLog(LogLevel.WARN, message, metadata));
}

export function logError(message: string, error?: Error | unknown, metadata?: LogMetadata): void {
  const errorMetadata = {
    ...metadata,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error,
  };

  console.error(formatLog(LogLevel.ERROR, message, errorMetadata));
}

export function logDebug(message: string, metadata?: LogMetadata): void {
  if (import.meta.env.DEV) {
    console.debug(formatLog(LogLevel.DEBUG, message, metadata));
  }
}

export function logContactFormSubmission(data: {
  name: string;
  email: string;
  company: string;
  description: string;
  userAgent?: string;
  clientIP?: string;
}): void {
  console.log('\n' + '='.repeat(50));
  console.log('📧 NEW CONTACT FORM SUBMISSION');
  console.log('='.repeat(50));
  console.log(`⏰ Timestamp:   ${new Date().toISOString()}`);
  console.log(`👤 Name:        ${data.name}`);
  console.log(`📨 Email:       ${data.email}`);
  console.log(`🏢 Company:     ${data.company}`);
  console.log(`📝 Description:\n   ${data.description.split('\n').join('\n   ')}`);
  
  if (data.userAgent) {
    console.log(`🖥️  User Agent:  ${data.userAgent}`);
  }
  
  if (data.clientIP) {
    console.log(`🌐 Client IP:   ${data.clientIP}`);
  }
  
  console.log('='.repeat(50) + '\n');
}

export function logAPIRequest(data: {
  method: string;
  path: string;
  userAgent?: string;
  clientIP?: string;
  statusCode?: number;
}): void {
  const metadata = {
    method: data.method,
    path: data.path,
    userAgent: data.userAgent,
    clientIP: data.clientIP,
    statusCode: data.statusCode,
  };

  logInfo(`API Request: ${data.method} ${data.path}`, metadata);
}
