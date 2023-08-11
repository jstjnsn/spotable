const express = require("express");
const app = express();
const compression = require("compression");
const RateLimit = require("express-rate-limit");
const debug = require("debug")("Spotable");

const postgres = require("pg-promise")({});

const devDbUrl = "postgres://spots:spots@localhost:5432/spots";
const dbUrl = process.env.DATABASE_URL || devDbUrl;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(compression());

// TODO: learn abour CSP, worker-src, blob:
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       "script-src": ["'self'", "api.mapbox.com"],
//     },
//   })
// );

// Maximum of twenty requests per minute
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
});

app.use(limiter);

app.set("view engine", "ejs");

// ROUTES

app.get("/", (_, res) => {
  res.redirect("/map");
});

app.get("/map", async (_, res) => {
  res.render("map", { title: "Map" });
});

app.get("/my-spots", async (_, res) => {
  try {
    const db = postgres(dbUrl);
    const spots = await db.any('select * from "spots"');
    res.render("my-spots", { spots, title: "My Spots" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error: " + error);
  }
});

app.get("/settings", async (_, res) => {
  res.render("settings", { title: "Settings" });
});

app.post("/spots", async (req, res) => {
  try {
    const spotDescription = req.body.description;
    const spotAddress = req.body.address;

    if (!spotDescription || !spotAddress) {
      throw new Error("One of the required fields is empty");
    }

    const db = postgres(dbUrl);
    const newSpot = await db.one(
      'insert into "spots" (description, address) values ($1, $2) returning *',
      [spotDescription, spotAddress]
    );

    console.log("CREATED: ", newSpot);

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal server error: " + error);
  }
});

// START SERVER

const PORT = 3000;

app.listen(PORT, () => debug(`🚀 Server running on http://localhost:${PORT}`));
