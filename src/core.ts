import { IncomingHttpHeaders } from "http";

export type HTTPMethods =
  | "get"
  | "head"
  | "post"
  | "put"
  | "delete"
  | "connect"
  | "options"
  | "trace"
  | "patch";
export interface Params {
  [key: string]: string;
}
export abstract class Request<T = Params> {
  public abstract headers: IncomingHttpHeaders;
  public abstract method: HTTPMethods;
  public abstract hostname: string;
  public abstract url: string;
  public abstract params: T;
  public abstract query: any;
  public abstract body: any;
  public abstract get(header: "set-cookie"): string[] | undefined;
  public abstract get(header: keyof IncomingHttpHeaders): string | undefined;
  public abstract get(header: string): string | undefined;
}
export abstract class Response {
  public abstract append(
    header: keyof IncomingHttpHeaders,
    value: string | string[]
  ): Response;
  public abstract append(header: string, value: string | string[]): Response;
  public abstract set(
    header: keyof IncomingHttpHeaders,
    value: string | string[]
  ): Response;
  public abstract set(header: string, value: string | string[]): Response;
  public abstract get(header: keyof IncomingHttpHeaders): string | undefined;
  public abstract get(header: string): string | undefined;
  public abstract status(code: number): Response;
  public abstract sendStatus(code: number): Response;
  public abstract send(body: string): Response;
  public abstract send(body: Buffer): Response;
  public abstract json(body: any): Response;
}
