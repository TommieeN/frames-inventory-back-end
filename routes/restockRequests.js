const express = require("express");
const router = express.Router();

router.post("/restock-requests", async (req, res) => {
  const { upc, quantity_requested } = req.body;

  try {
    await knex("restock_requests").insert({
      upc,
      quantity_requested,
    });

    res.status(201).json({ message: "Restock request created" });
  } catch (err) {
    console.error("Error inserting restock request:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});


module.exports = router;