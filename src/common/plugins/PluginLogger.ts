export class PluginLogger {
  private readonly name: string;

  public constructor(name: string) {
    this.name = name;
  }

  public log(...msg: any[]) {
    console.log(`[${this.name}]`, ...msg);
  }

  public warn(...msg: any[]) {
    console.warn(`[${this.name}]`, ...msg);
  }

  public error(...msg: any[]) {
    console.error(`[${this.name}]`, ...msg);
  }
}
