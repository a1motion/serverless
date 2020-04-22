import { Plugin, Compiler } from "webpack";

const extensionRegexp = /\.(css|js|mjs)(\?|$)/;

export default class BuildManifestPlugin implements Plugin {
  apply(compiler: Compiler) {
    compiler.hooks.emit.tap("BuildManifestPlugin", (compilation) => {
      const entrypoints = Array.from(compilation.entrypoints.keys());
      const build: any = {};
      entrypoints.forEach((entrypoint) => {
        build[entrypoint] = {
          js: [],
          css: [],
        };
        const files = compilation.entrypoints.get(entrypoint).getFiles();
        files.forEach((file: string) => {
          const extMatch = extensionRegexp.exec(file);
          if (!extMatch) {
            return;
          }

          const ext: "js" | "css" = (extMatch[1] === "mjs"
            ? "js"
            : extMatch[1]) as "js" | "css";
          build[entrypoint][ext].push(file);
        });
      });
      const buildJSON = JSON.stringify(build, undefined, 4);
      compilation.assets["build.json"] = {
        source: () => buildJSON,
        length: () => buildJSON.length,
        size: () => buildJSON.length,
      };
    });
  }
}
