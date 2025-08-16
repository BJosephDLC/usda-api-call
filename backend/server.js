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
        const { query, pageSize = 10, pageNumber = 1, dataType } = req.query;
        if (!query) return res.status(400).json({ error: "query is required" });

        const r = await axios.get(`${USDA_BASE} / foods / search`, {
            params: {
                api_key: USDA_API_KEY,
                query,
                pageSize,
                pageNumber,
                dataType // optional: Branded, Foundation, Survey (FNDDS), SR Legacy
            }
        });
        res.json(r.data);
    } catch (err) {
        const status = err.response?.status || 500;
        res.status(status).json({
            error: "USDA search failed",
            detail: err.response?.data || err.message
        });
    }
});

// example: get a food by FDC ID
// frontend calls: GET /api/usda/foods/1104067
app.get("/api/usda/foods/:fdcId", async (req, res) => {
    try {
        const { fdcId } = req.params;
        const r = await axios.get(`${USDA_BASE} / food / ${fdcId}`, {
            params: { api_key: USDA_API_KEY }
        });
        res.json(r.data);
    } catch (err) {
        const status = err.response?.status || 500;
        res.status(status).json({
            error: "USDA food lookup failed",
            detail: err.response?.data || err.message
        });
    }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));