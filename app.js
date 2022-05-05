require("dotenv").config();
const path = require("path");
const s3 = require("./utils/s3");

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

// API routes
app.use("/api/" + `${process.env.API_VERSION}`, [
  require("./server/routes/api/recipe_route"),
  require("./server/routes/api/user_route"),
  require("./server/routes/api/keyword_route"),
]);

// User flow
app.use("/", [
  require("./server/routes/userflow/user_route"),
  require("./server/routes/userflow/recipe_route"),
]);

// app.get("/s3Url", async (req, res) => {
//   const url = await s3.generateUploadURL();
//   res.status(200).json({ s3Url: url });
// });

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});

// Page not found
app.use(function (req, res, next) {
  res.status(404).sendFile(__dirname + "/public/html/redirect/404.html");
});

// Error handling
app.use(function (err, req, res, next) {
  console.log(err);
  if (err.isJoi) {
    err.status = 400;
    err.message = `Bad Request`;
    console.log(err);
  }
  let msg = err.message || "Internal Server Error";
  res.status(err.status || 500).send({ error: msg });
});
