module.exports = function route(this: any) {
  const options: {
    mod: string;
    middleware: string;
    runtime: string;
  } = this.getOptions();
  return `
const mod = require("${options.mod}");
const middleware = [${options.middleware
    .split(",")
    .filter(Boolean)
    .map((middleware) => {
      return `require("${middleware}")`;
    })
    .join(", ")}];
const {createHandler} = require("${options.runtime}");
exports.handler = createHandler(mod, [...middleware, ...(mod.middleware || [])]);
`;
};
