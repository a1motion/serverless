import path from "path";
import { match, MatchFunction } from "path-to-regexp";
import { Config } from ".";

export function getPathNameFromFile(file: string) {
  return file === "/"
    ? "index"
    : file
        .replace(/^\//, "")
        .replace(/\//g, "-")
        .replace(/(:)/g, "")
        .replace("*", "-all");
}

export interface CompiledPath {
  name: string;
  file: string;
  match: MatchFunction<any>;
}
export interface CompiledPathWithModule extends CompiledPath {
  module: any;
}
export function compilePaths(paths: { [key: string]: string }): CompiledPath[] {
  return Object.entries(paths).reduce((compiled, [name, file]) => {
    return [...compiled, { name, file, match: match(name) }];
  }, [] as CompiledPath[]);
}

export const root = process.cwd();
export const out = path.join(root, "out");
export const tmp = path.join(root, ".tmp");
export const appSrc = path.join(root, "src");
export const env = process.env.NODE_ENV || "development";
export const dev = env === "development";
export const prod = env === "production";
export function getSourceFile(file: string) {
  return path.resolve(file);
}

export function normalizeConfig(o: Config) {
  //@ts-ignore
  const config: Config = {};

  config.paths = o.paths || {};
  config.middleware = o.middleware || [];
  return config;
}
