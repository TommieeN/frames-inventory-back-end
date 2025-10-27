const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all frames
router.get("/", async (req, res) => {
  try {
    const frames = await db("frames").select("*");
    res.json(frames);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch frames" });
  }
});

// GET frame by UPC
router.get("/:upc", async (req, res) => {
  try {
    const { upc } = req.params;
    const frame = await db("frames").where({ upc }).first();
    if (!frame) return res.status(404).json({ error: "Frame not found" });
    res.json(frame);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch frame" });
  }
});

module.exports = router;
