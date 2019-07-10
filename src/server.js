const express = require("express");
const bodyParser = require("body-parser");
const connectDB = require("../database");

const app = express();

connectDB();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", (req, res) => res.send("Server Working."));
app.use("/api/auth", require("../controllers/authController"));
app.use("/api/projects", require("../controllers/projectController"));

const PORT = process.env.PORT | 3333;

app.listen(PORT);

console.log(`Server Running on Port ${PORT}.`);
