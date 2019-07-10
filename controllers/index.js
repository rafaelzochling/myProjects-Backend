const fs = require("fs");
const path = require("path");

//This archive is not being used, it's just an example to remind
module.exports = fs
  .readdirSync(__dirname)
  .filter(file => file.indexOf(".") !== 0 && file !== "index.js")
  .forEach(file => require(path.resolve(__dirname, file))(app));
