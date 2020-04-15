import path from "path";
import fs from "fs";
import webpack from "webpack";
import ora from "ora";
import yargs from "yargs";
import webpackConfig from "./webpack-config";
import {
  getPathNameFromFile,
  tmp,
  compilePaths,
  CompiledPathWithModule,
  getSourceFile,
  out,
  normalizeConfig,
} from "./utils";
import { createServer } from "./dev-server";
import { Config } from ".";

const spinner = ora({ indent: 2 });

type StringStringRecord = Record<string, string>;

const providers: StringStringRecord = {
  dev: require.resolve("./runtime/dev"),
  aws: require.resolve("./runtime/aws"),
};

function buildForPaths(
  config: Config,
  isDev: boolean = false
): { [key: string]: string } {
  spinner.info("Building Paths").start();
  spinner.indent = 4;
  const e: { [key: string]: string } = {};
  const { middleware } = config;
  for (const [name, filePath] of Object.entries(config.paths)) {
    spinner.text = `Building Path [${name}]`;
    const sourcePath = getSourceFile(filePath);
    const outputName = getPathNameFromFile(name);
    e[outputName] = `internal-route-loader?mod=${encodeURIComponent(
      sourcePath
    )}&middleware=${encodeURIComponent(middleware.join(","))}&runtime=${
      providers[isDev ? "dev" : "aws"]
    }!`;
    spinner.succeed(`Built Path [${name}]`).start();
  }

  spinner.indent = 2;
  spinner.succeed("Built Paths").start();

  return e;
}

function webpackAsync(c: webpack.Configuration) {
  return new Promise((resolve, reject) => {
    webpack(c).run((err, stats) => {
      if (err) {
        return reject(err);
      }

      return resolve(stats);
    });
  });
}

const delay = (ms: number) => new Promise((p) => setTimeout(p, ms));

async function build(config: Config, isDev: boolean = false) {
  console.log();
  spinner.start();
  const entry = buildForPaths(config, isDev);
  spinner.text = "Bundling";
  await delay(3000);
  await webpackAsync({ ...webpackConfig, entry });
  await fs.promises.rmdir(tmp, { recursive: true });
  spinner.succeed("Bundled").start();
  return config;
}

async function dev(config: Config) {
  const { paths } = await build(config, true);
  const mods: CompiledPathWithModule[] = compilePaths(paths).map((a) => {
    const outputName = getPathNameFromFile(a.name);
    return { ...a, module: require(path.join(out, `${outputName}.js`)) };
  });
  spinner.info("Starting Server at http://localhost:3000");
  console.log();
  const server = createServer(mods);
  server.listen(3000);
}

yargs
  .scriptName("srv")
  .option("config", {
    default: "./srv.js",
    string: true,
    requiresArg: true,
    normalize: true,
    coerce(file) {
      if (!fs.existsSync(file)) {
        throw new Error(`Could not find file: ${file}`);
      }

      const c = require(path.resolve(file));

      return normalizeConfig(c);
    },
  })
  .command({
    command: "build",
    describe: "build",
    async handler(args) {
      await build(args.config as Config);
      spinner.stop();
      console.log();
    },
  })
  .command({
    command: "dev",
    describe: "dev",
    async handler(args) {
      await dev(args.config as Config);
    },
  })
  .demandCommand()
  .showHelpOnFail(true)
  .wrap(102).argv;
