const express = require("express");
const router = express.Router();
const db = require("../db");

// Create a new restock request
router.post("/", async (req, res) => {
  const { upc, quantity_requested, picking_location } = req.body;

  if (!upc || !quantity_requested || !picking_location) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await db("restock_requests").insert({
      upc,
      quantity_requested,
      picking_location,
    });

    res.status(201).json({ message: "Restock request submitted." });
  } catch (err) {
    console.error("Error inserting restock request:", err);
    res.status(500).json({ error: "Failed to submit restock request." });
  }
});

module.exports = router;