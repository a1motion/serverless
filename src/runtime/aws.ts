import { IncomingHttpHeaders, STATUS_CODES } from "http";
import { Request, HTTPMethods, Response } from "../core";
import { Handler, Exports } from "..";

interface LambdaEvent {
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  httpMethod: HTTPMethods;
  headers: IncomingHttpHeaders;
  pathParameters: { [key: string]: string };
  queryStringParameters: { [key: string]: any };
  requestContext: {
    http: {
      method: HTTPMethods;
    };
  };
  body: string;
  isBase64Encoded: boolean;
}

class LambdaRequest<T> implements Request<T> {
  private event: LambdaEvent;
  headers: IncomingHttpHeaders;
  method: HTTPMethods;
  url: string;
  params: T;
  query: any;
  constructor(event: LambdaEvent) {
    this.event = event;
    this.headers = event.headers;
    this.method = event.requestContext.http.method.toLowerCase() as HTTPMethods;
    this.url = event.rawPath;
    this.params = (event.pathParameters as unknown) as T;
    this.query = event.queryStringParameters;
  }
  get _body() {
    if (this.event.isBase64Encoded) {
      return Buffer.from(this.event.body, "base64").toString("utf-8");
    }

    return this.event.body;
  }
  get body() {
    const encoding = this.get("content-encoding");
    if (
      encoding === "application/json" ||
      encoding === "application/x-www-form-urlencoded"
    ) {
      try {
        return JSON.parse(this._body);
      } catch (_e) {
        return undefined;
      }
    }

    return undefined;
  }
  get hostname() {
    return this.get("host") || "";
  }
  get(header: "set-cookie"): string[] | undefined;
  get(header: keyof IncomingHttpHeaders): string | undefined;
  get(header: string): string | undefined;
  get(header: any) {
    return this.headers[header.toLowerCase()];
  }
}

class LambdaResponse implements Response {
  headers = new Map<string, string | string[]>();
  statusCode: number = 200;
  _end: boolean = false;
  _body: string | Buffer = "";
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
    this.headers.set(header, value);
    return this;
  }
  get(header: keyof IncomingHttpHeaders): string | undefined;
  get(header: string): string | undefined;
  get(header: any) {
    return this.headers.get(header.toLowerCase());
  }
  status(code: number): Response {
    this.statusCode = code;
    return this;
  }
  sendStatus(code: number): Response {
    const body = STATUS_CODES[code] || String(code);
    return this.status(code).set("content-type", "text/plain").send(body);
  }
  end(body: string | Buffer) {
    if (this._end) {
      throw new Error("Cannot send body twice.");
    }

    this._end = true;
    this._body = body;
  }
  send(body: string | Buffer) {
    this.end(body);
    return this;
  }
  json(body: any) {
    return this.set("content-type", "application/json").send(
      JSON.stringify(body)
    );
  }
}

function getHeaders(headers: Map<string, string | string[]>) {
  const h: { [key: string]: string | string[] } = {};
  headers.forEach((value, key) => {
    h[key] = value;
  });
  return h;
}

function generateResponse(response: LambdaResponse) {
  return {
    statusCode: response.statusCode,
    headers: getHeaders(response.headers),
    body: response._body,
  };
}

export function createHandler(mod: Exports, middleware: Handler[]) {
  return async (event: LambdaEvent) => {
    const request = new LambdaRequest<any>(event);
    const response = new LambdaResponse();
    for (const middleman of middleware) {
      await middleman(request, response);
      if (response._end) {
        return generateResponse(response);
      }
    }

    const userHandler: Handler | undefined = mod[request.method] || mod.all;
    if (userHandler) {
      const result = await userHandler(request, response);

      if (!response._end) {
        if (typeof result === "string") {
          response.set("content-type", "text/plain").send(result);
        } else if (typeof result === "object") {
          response.json(result);
        }
      }

      if (!response._end) {
        response.end("");
      }
    } else {
      response.sendStatus(405);
    }

    return generateResponse(response);
  };
}
