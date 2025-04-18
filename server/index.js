import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import * as prismic from "@prismicio/client";
import PrismicDOM from "prismic-dom";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const initAPI = (req) => {
  const client = prismic.createClient(process.env.PRISMIC_REPO_NAME, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
  });

  return client;
};

const handleLinkResolver = (doc) => {
  return "/";
};

app.use((req, res, next) => {
  res.locals.ctx = {
    endpoint: process.env.PRISMIC_ENDPOINT,
    linkResolver: handleLinkResolver,
  };

  res.locals.PrismicDOM = PrismicDOM;
  next();
});

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.render("pages/home", { title: "My Vite Express App" });
});

app.get("/about", async (req, res) => {
  try {
    const client = initAPI(req);
    const response = await client.getByType("about");

    const { results } = response;
    const [meta, about] = results;
    console.log(meta);

    res.render("pages/about", {
      document: response.results[0],
      title: "My Vite Express App",
    });
  } catch (err) {
    console.error("Prismic error:", err);
    res.status(500).send("Error fetching Prismic content.");
  }
});

app.get("/detail/:id", (req, res) => {
  res.render("pages/detail", { title: "My Vite Express App" });
});
app.get("/collections", (req, res) => {
  res.render("pages/collections", { title: "My Vite Express App" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
