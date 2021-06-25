// import * as Winston from 'winston';

// const loggerOptions = {
//   levels: {
//     warn: 0,
//     debug: 1,
//     error: 2,
//     info: 3
//   }
// };

// function parseLogLevel(level: number): string {
//   const levelNames = Object.keys(loggerOptions.levels);
//   const valueIndex = Object.values(loggerOptions.levels).indexOf(level);

//   if (valueIndex === -1) {
//     return levelNames[levelNames.length - 1];
//   }

//   return levelNames[valueIndex];
// }

// const getLoggerInstance = (level: number): Winston.Logger => {
//   const levelName = parseLogLevel(level);
//   const logger = Winston.createLogger({
//     level: levelName,
//     exitOnError: true,
//     handleExceptions: true,
//     format: Winston.format.combine(
//       Winston.format.colorize({ all: true }),
//       Winston.format.timestamp({ format: 'YYYY-MM-DD HH:MM:SS' }),
//       Winston.format.splat(),
//       Winston.format.printf((info: Winston.Logform.TransformableInfo) => `${info.timestamp} ${info.level}: ${info.message}`)
//     ),
//     transports: [new Winston.transports.Console()]
//   });

//   // console.log(process.env.STAGE)

//   if (process.env.STAGE !== 'development') {
//     logger.silent = true;
//   }

//   return logger;
// };

export const logger = {
  info: console.log,
  warn: console.warn,
  error: console.error,
  debug: console.debug
}
