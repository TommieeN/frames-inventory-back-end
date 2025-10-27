const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all restock requests
router.get("/", async (req, res) => {
  try {
    const requests = await db("restock_requests")
      .join("frames", "restock_requests.upc", "frames.upc")
      .leftJoin("overstock", "restock_requests.upc", "overstock.upc")
      .select(
        "restock_requests.id",
        "restock_requests.upc",
        "frames.description",
        "frames.brand",
        "restock_requests.status",
        "restock_requests.completed_at",
        "restock_requests.delivered_quantity",
        "restock_requests.pulled_from_location",
        "overstock.location",
        "overstock.quantity"
      )
      .orderByRaw(
        `FIELD(restock_requests.status, 'PENDING', 'DELIVERED'), restock_requests.completed_at ASC`
      );

    // group overstock locations
    const grouped = {};
    requests.forEach((row) => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          upc: row.upc,
          description: row.description,
          brand: row.brand,
          status: row.status,
          completed_at: row.completed_at,
          delivered_quantity: row.delivered_quantity,
          pulled_from_location: row.pulled_from_location,
          overstock_locations: [],
        };
      }
      if (row.location) {
        grouped[row.id].overstock_locations.push({
          location: row.location,
          quantity: row.quantity,
        });
      }
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get requests" });
  }
});

// POST new restock request
router.post("/", async (req, res) => {
  const { upc } = req.body;
  if (!upc) return res.status(400).json({ error: "UPC is required" });

  try {
    const frame = await db("frames").where({ upc }).first();
    if (!frame) return res.status(404).json({ error: "Frame not found" });

    const [id] = await db("restock_requests").insert({
      upc,
      status: "PENDING",
      requested_at: new Date(),
    });

    const newRequest = await db("restock_requests").where({ id }).first();

    res.status(201).json({ message: "Restock request created", restockRequest: newRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH complete request
router.patch("/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { delivered_quantity, pulled_from_location } = req.body;

  if (!delivered_quantity || !pulled_from_location)
    return res.status(400).json({ error: "Quantity and location required." });

  try {
    const request = await db("restock_requests").where({ id }).first();
    if (!request) return res.status(404).json({ error: "Restock request not found" });

    await db("restock_requests").where({ id }).update({
      status: "DELIVERED",
      delivered_quantity,
      pulled_from_location,
      completed_at: db.fn.now(),
    });

    const overstock = await db("overstock")
      .where({ upc: request.upc, location: pulled_from_location })
      .first();

    if (!overstock) return res.status(404).json({ error: "Overstock location not found." });
    if (overstock.quantity < delivered_quantity)
      return res.status(400).json({ error: "Not enough quantity in overstock." });

    await db("overstock")
      .where({ upc: request.upc, location: pulled_from_location })
      .decrement("quantity", delivered_quantity);

    res.json({ message: "Restock request marked as delivered and overstock updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = router;
