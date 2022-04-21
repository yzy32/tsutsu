require("dotenv").config();
const path = require("path");

// Express Initialization
const express = require("express");
const cors = require("cors");
const app = express();

app.set("trust proxy", true);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS allow all
app.use(cors());

app.get("/test", (req, res) => {
  res.json({
    msg: `${process.env.DOMAIN}:${process.env.ES_PORT}, ${process.env.API_VERSION}`,
  });
});

// API routes
app.use("/api/" + `${process.env.API_VERSION}`, [
  require("./server/routes/api/recipe_route"),
  // require("./server/routes/api/user_route"),
]);

// User flow
app.use("/", [
  require("./server/routes/userflow/user_route"),
  require("./server/routes/userflow/recipe_route"),
]);

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});

// Page not found
// app.use(function (req, res, next) {
//   res.status(404).sendFile(__dirname + "/public/404.html");
// });

// Error handling
app.use(function (err, req, res, next) {
  console.log(err);
  res.status(500).send("Internal Server Error");
});
