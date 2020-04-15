import { Exports } from "../../lib";

declare let exports: Exports;

exports.get = (req, res) => {
  console.log(req.params);
  res.json(req.params);
};

exports.post = (req, res) => {
  res.json(req.body);
};
