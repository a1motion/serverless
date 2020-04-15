import http from "http";
import { CompiledPathWithModule } from "./utils";

export function devServerHandler(paths: CompiledPathWithModule[]) {
  return function devServerHandler(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const found = paths.some((p) => {
      if (p.match(req!.url!)) {
        p.module.handler(req, res, p);
        return true;
      }

      return false;
    });
    if (!found) {
      res.writeHead(404, { "Content-Type": "text/plain" }).end("Not Found");
    }
  };
}

export function createServer(paths: CompiledPathWithModule[]) {
  const server = http.createServer(devServerHandler(paths));
  return server;
}
