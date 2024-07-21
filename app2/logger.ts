import winston from 'winston';
import { trace, context } from '@opentelemetry/api';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      const currentSpan = trace.getSpan(context.active());
      let traceId = 'N/A';
      if (currentSpan) {
        const spanContext = currentSpan.spanContext();
        traceId = spanContext.traceId;
      }
      return `${timestamp} [${level}] [TraceId: ${traceId}] ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
  ]
});