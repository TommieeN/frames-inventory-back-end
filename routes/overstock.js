const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all overstock
router.get("/", async (req, res) => {
  try {
    const data = await db("overstock")
      .join("frames", "overstock.upc", "frames.upc")
      .select(
        "overstock.id",
        "overstock.upc",
        "overstock.location",
        "overstock.quantity",
        "overstock.last_updated",
        "frames.sku",
        "frames.description",
        "frames.color_code",
        "frames.brand"
      )
      .orderBy("overstock.location", "asc");

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch overstock data" });
  }
});

// POST add to overstock
router.post("/", async (req, res) => {
  const { upc, quantity, location } = req.body;
  if (!upc || !quantity || !location)
    return res.status(400).json({ error: "Missing required fields" });

  try {
    await db("overstock").insert({ upc, quantity, location });
    res.json({ message: `${upc} stored successfully at ${location}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to store overstock data" });
  }
});

// DELETE overstock
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db("overstock").where({ id }).first();
    if (!existing)
      return res.status(404).json({ error: "Overstock not found." });

    await db("overstock").where({ id }).del();
    res.json({
      message: `Overstock ${id} deleted successfully`,
      deleted: existing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete restock request" });
  }
});

// EDIT overstock
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { upc, location, quantity } = req.body;
  try {
    const result = await db("overstock") // <- use 'db' and correct table name
      .where({ id })
      .update({ upc, location, quantity, last_updated: db.fn.now() });

    if (result === 0) {
      return res.status(404).json({ error: "Overstock item not found" });
    }

    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
