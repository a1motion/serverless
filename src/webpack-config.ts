import webpack from "webpack";
import { dev, out, appSrc } from "./utils";

const config: webpack.Configuration = {
  mode: dev ? "development" : "production",
  devtool: dev ? "cheap-module-source-map" : "source-map",
  entry: {},
  output: {
    path: out,
    libraryTarget: "commonjs2",
  },
  target: "node",
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".jsx", ".json"],
    alias: {},
  },
  resolveLoader: {
    alias: {
      "internal-route-loader": require.resolve("./loaders/route"),
    },
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      name: false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|mjs|jsx|ts|tsx)$/,
        include: appSrc,
        loader: require.resolve("babel-loader"),
        options: {
          presets: [
            [require.resolve("@babel/preset-env"), { targets: { node: 12 } }],
            require.resolve("@babel/preset-typescript"),
          ],
        },
      },
    ],
  },
};

export default config;
