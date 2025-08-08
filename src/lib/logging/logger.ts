import winston from "winston";

export const LogLevels = {
  ERROR: "ERROR",
  WARN: "WARN",
  AUDIT: "AUDIT",
  INFO: "INFO",
  TRIVIAL: "TRIVIAL",
};

const levels = { ERROR: 0, WARN: 1, AUDIT: 2, INFO: 3, TRIVIAL: 4 };
const colours = {
  ERROR: "red",
  WARN: "yellow",
  AUDIT: "blue",
  INFO: "grey",
  TRIVIAL: "grey",
};

winston.addColors(colours);

export const logger = winston.createLogger({
  levels,
  exitOnError: false,
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "./logs/amps.err.log",
      level: LogLevels.ERROR,
    }),
    new winston.transports.File({
      filename: "./logs/amps.audit.log",
      level: LogLevels.AUDIT,
    }),
    new winston.transports.File({
      filename: "./logs/amps.all.log",
      level: LogLevels.INFO,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
      level: LogLevels.INFO,
    }),
  ],
});

export type AuditFn = (msg: string, ...meta: Record<string, unknown>[]) => void;
