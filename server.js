import express from "express";
import pgPromise from "pg-promise";

const pgp = pgPromise({});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const PORT = 3000;

app.get("/map", async (_, res) => {
  res.render("map", { title: "Map" });
});

app.get("/my-spots", async (_, res) => {
  try {
    const db = pgp("postgres://spots:spots@localhost:5432/spots");
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

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
