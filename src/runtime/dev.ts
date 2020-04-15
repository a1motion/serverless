import { parse } from "url";
import { parse as parsequery } from "qs";
import {
  IncomingMessage,
  ServerResponse,
  IncomingHttpHeaders,
  STATUS_CODES,
} from "http";
import bodyParser from "body-parser";
import { Request, HTTPMethods, Response } from "../core";
import { CompiledPath } from "../utils";
import { Handler, Exports } from "..";

class DevRequest<T> implements Request<T> {
  private req: IncomingMessage;
  public params: T;
  public body: any;
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(req: IncomingMessage, params: T, body: any) {
    this.req = req;
    this.params = params;
    this.body = body;
  }
  get headers() {
    return this.req.headers;
  }
  get method() {
    return this.req.method!.toLowerCase() as HTTPMethods;
  }
  get hostname() {
    return this.get("host") || "";
  }
  get url() {
    return this.req.url || "";
  }
  get query() {
    return parsequery(parse(this.url).query!);
  }
  get(header: "set-cookie"): string[] | undefined;
  get(header: keyof IncomingHttpHeaders): string | undefined;
  get(header: string): string | undefined;
  get(header: any) {
    return this.headers[header.toLowerCase()];
  }
}

class DevResponse implements Response {
  private res: ServerResponse;
  append(header: keyof IncomingHttpHeaders, value: string | string[]): Response;
  append(header: string, value: string | string[]): Response;
  append(header: any, val: string | string[]): Response {
    const prev = this.get(header);
    let value = val;
    if (prev) {
      value = Array.isArray(prev)
        ? prev.concat(val)
        : Array.isArray(val)
        ? [prev].concat(val)
        : [prev, val];
    }

    return this.set(header, value);
  }
  set(header: keyof IncomingHttpHeaders, value: string | string[]): Response;
  set(header: string, value: string | string[]): Response;
  set(header: any, val: any): Response {
    const value = Array.isArray(val) ? val.map(String) : String(val);
    this.res.setHeader(header, value);
    return this;
  }
  get(header: keyof IncomingHttpHeaders): string | undefined;
  get(header: string): string | undefined;
  get(header: any) {
    return this.res.getHeader(header.toLowerCase());
  }
  status(code: number): Response {
    this.res.statusCode = code;
    return this;
  }
  sendStatus(code: number): Response {
    const body = STATUS_CODES[code] || String(code);
    return this.status(code).set("content-type", "text/plain").send(body);
  }
  send(body: string | Buffer) {
    this.res.end(body);
    return this;
  }
  json(body: any) {
    return this.set("content-type", "application/json").send(
      JSON.stringify(body)
    );
  }
  constructor(res: ServerResponse) {
    this.res = res;
  }
}

const jsonParser = bodyParser.json();
const urlEncodedParser = bodyParser.urlencoded({ extended: true });

function readBody(req: IncomingMessage, res: ServerResponse): Promise<void> {
  return new Promise((resolve) => {
    jsonParser(req, res, () => {
      urlEncodedParser(req, res, () => {
        resolve();
      });
    });
  });
}

export function createHandler(mod: Exports, middleware: Handler[]) {
  return async (
    req: IncomingMessage,
    res: ServerResponse,
    path: CompiledPath
  ) => {
    await readBody(req, res);
    const params = path.match(req.url!);
    const request = new DevRequest(
      req,
      { ...(params ? params.params : {}) },
      (req as any).body
    );
    const response = new DevResponse(res);
    for (const middleman of middleware) {
      await middleman(request, response);
      if (res.writableEnded) {
        return;
      }
    }

    const userHandler: Handler | undefined = mod[request.method] || mod.all;

    if (userHandler) {
      const result = await userHandler(request, response);
      if (res.writableEnded) {
        return;
      }

      if (typeof result === "string") {
        response.set("content-type", "text/plain").send(result);
      } else if (typeof result === "object") {
        response.json(result);
      }

      if (!res.writableEnded) {
        res.end();
      }
    } else {
      response.sendStatus(405);
    }
  };
}
