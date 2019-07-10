const path = require("path");
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");

const { host, port, user, pass } = require("../../config/mailer");

const transport = nodemailer.createTransport({
  host,
  port,
  auth: {
    user,
    pass
  }
});

transport.use(
  "compile",
  hbs({
    viewEngine: {
      extname: ".hbs",
      layoutsDir: path.resolve("./src/resources/mail/auth"),
      defaultLayout: "layout",
      partialsDir: path.resolve("./src/resources/mail/")
    },
    viewPath: path.resolve("./src/resources/mail/"),
    extName: ".html"
  })
);

module.exports = transport;
