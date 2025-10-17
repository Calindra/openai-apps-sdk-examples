export default class Logger {
  static info(...args: any[]) {
    console.log(...args);
  }
  static log(...args: any[]) {
    console.log(...args);
  }
  static error(...args: any[]) {
    console.error(...args);
  }
}