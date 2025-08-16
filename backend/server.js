const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());

// lock CORS to your frontend in dev
app.use(cors({ origin: process.env.FRONTEND_ORIGIN, credentials: true }));

const USDA_BASE = process.env.USDA_BASE || "https://api.nal.usda.gov/fdc/v1";
const USDA_API_KEY = process.env.USDA_API_KEY;

// quick sanity check
if (!USDA_API_KEY) {
  console.error("Missing USDA_API_KEY in .env");
  process.exit(1);
}

// example: search foods
// frontend calls: GET /api/usda/search?query=apple&pageSize=5
app.get("/api/usda/search", async (req, res) => {
  try {
    let {
      query,
      pageSize = "10",
      pageNumber = "1",
      dataType,
      brandOwner,
      requireAllWords,
      compact,
    } = req.query;

    if (!query || !String(query).trim()) {
      return res.status(400).json({ error: "query is required" });
    }

    const ps = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 50); // clamp 1..50
    const pn = Math.max(parseInt(pageNumber, 10) || 1, 1);

    // allow dataType=Branded,Foundation or repeated params
    let dt;
    if (dataType) {
      if (Array.isArray(dataType)) dt = dataType;
      else
        dt = String(dataType)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
    }

    const requireAll =
      typeof requireAllWords !== "undefined" &&
      ["1", "true", "yes"].includes(String(requireAllWords).toLowerCase());

    const isCompact =
      typeof compact !== "undefined" &&
      ["1", "true", "yes"].includes(String(compact).toLowerCase());

    const params = {
      api_key: USDA_API_KEY,
      query: String(query).trim(),
      pageSize: ps,
      pageNumber: pn,
    };
    if (dt?.length) params.dataType = dt;
    if (brandOwner) params.brandOwner = brandOwner;
    if (typeof requireAllWords !== "undefined")
      params.requireAllWords = requireAll;

    const url = `${USDA_BASE}/foods/search`;
    const r = await axios.get(url, { params });

    if (!isCompact) {
      return res.json(r.data);
    }

    // compact response: common fields and key nutrients
    const foods = (r.data.foods || []).map((f) => {
      const pick = (id) =>
        f.foodNutrients?.find((n) => n.nutrientId === id)?.value ?? null;
      return {
        fdcId: f.fdcId,
        description: f.description,
        brandOwner: f.brandOwner,
        dataType: f.dataType,
        publishedDate: f.publishedDate,
        servingSize: f.servingSize,
        servingSizeUnit: f.servingSizeUnit,
        calories: pick(1008), // Energy (kcal)
        protein_g: pick(1003), // Protein
        carbs_g: pick(1005), // Carbs
        fat_g: pick(1004), // Total fat
        sugars_g: pick(2000), // Total sugars
        fiber_g: pick(1079), // Fiber
      };
    });

    res.json({
      totalHits: r.data.totalHits,
      currentPage: r.data.currentPage,
      totalPages: r.data.totalPages,
      foods,
    });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({
      error: "USDA search failed",
      detail: err.response?.data || err.message,
    });
  }
});

// example: get a food by FDC ID
// frontend calls: GET /api/usda/foods/1104067
app.get("/api/usda/foods/:fdcId", async (req, res) => {
  const { fdcId } = req.params;
  try {
    const base = (process.env.USDA_BASE || "https://api.nal.usda.gov/fdc/v1")
      .trim()
      .replace(/\/+$/, "");
    const url = `${base}/food/${encodeURIComponent(fdcId)}`; // note: singular "food"
    console.log("DETAIL URL ->", url, "fdcId ->", fdcId);

    const r = await axios.get(url, {
      params: { api_key: process.env.USDA_API_KEY },
    });

    res.json(r.data);
  } catch (err) {
    const status = err.response?.status || 500;
    const info = err.response?.data || err.message;
    console.error("DETAIL FAIL", status, info);
    res.status(status).json({
      error: "USDA food lookup failed",
      detail: info,
      urlTried: `${(process.env.USDA_BASE || "").trim()}/food/${
        req.params.fdcId
      }`,
    });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
