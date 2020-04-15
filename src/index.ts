import { Request, Response, HTTPMethods } from "./core";

export type Handler = (req: Request, res: Response) => any | PromiseLike<any>;
export type Exports = { [key in HTTPMethods]?: Handler } & {
  get?: Handler;
  post?: Handler;
  put?: Handler;
  delete?: Handler;
  patch?: Handler;
  all?: Handler;
};
export { Request, Response };
export interface Config {
  paths: { [key: string]: string };
  middleware: string[];
}
