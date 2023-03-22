const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const userRoute = require("./routes/userRoute");
const openAiRoute = require("./routes/openAiRoute");
const errorHandler = require("./middleWare/errorMiddleware");
const cookieParser = require("cookie-parser");
const path = require("path");
const { hotmartController } = require("./controllers/hotmartController");
const MongoClient = require("mongodb").MongoClient;

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(
  cors({
    origin: ["https://app.educagenius.com"],
    credentials: true,
  })
);

app.use("/api/users", userRoute);
app.use("/openai", openAiRoute);
app.post("/hotmart-webhook", hotmartController);

const root = require("path").join(__dirname, "/build", "index.html");

app.use(express.static(root));

app.get("*", (req, res) => {
  res.sendFile("index.html", {
    root,
  });
});

const PORT = process.env.PORT || 4800;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error.message);
  });
