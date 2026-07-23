export interface HttpCookieOptions {
  secure: boolean
  httpOnly: boolean
  maxAge: number
}

export default class Cookie {
  private name: string;
  private data: string;
  private opts: HttpCookieOptions;

  constructor(name: string, data: string, opts: HttpCookieOptions) {
    this.name = name;
    this.data = data;
    this.opts = opts;
  }

  getName() {
    return this.name;
  }

  getData() {
    return this.data;
  }

  getOpts() {
    return this.opts;
  }
}
