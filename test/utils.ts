import test from "ava";
import * as utils from "../src/utils";

test(`getPathNameFromFile - should convert root path`, (t) => {
  t.is(utils.getPathNameFromFile(`/`), `index`);
});

test(`getPathNameFromFile - should convert path with params`, (t) => {
  t.is(utils.getPathNameFromFile(`/:one/:two`), `one-two`);
});

test(`getPathNameFromFile - should convert path with params after root`, (t) => {
  t.is(utils.getPathNameFromFile(`/one/:two`), `one-two`);
});
