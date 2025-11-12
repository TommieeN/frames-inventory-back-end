const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all restock requests
router.get("/", async (req, res) => {
  try {
    const rows = await db("restock_requests")
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
        "overstock.id as overstock_id",
        "overstock.location",
        "overstock.quantity"
      )
      .orderByRaw(
        `FIELD(restock_requests.status, 'PENDING', 'DELIVERED'), restock_requests.completed_at ASC`
      );

    const grouped = {};

    rows.forEach((row) => {
      if (!grouped[row.id]) {
        grouped[row.id] = {
          id: row.id,
          upc: row.upc,
          description: row.description,
          brand: row.brand,
          status: row.status,
          completed_at: row.completed_at,
          delivered_quantity: row.delivered_quantity,
          overstock_locations: [],
        };

        // Completed requests → use pulled_from_location snapshot
        if (row.status === "DELIVERED" && row.pulled_from_location) {
          try {
            grouped[row.id].overstock_locations = JSON.parse(
              row.pulled_from_location
            ).map((loc) => ({
              ...loc,
              remaining_quantity: loc.total_quantity - loc.quantity,
            }));
          } catch (e) {
            console.error(
              `Failed to parse pulled_from_location for request ${row.id}`
            );
          }
        }
      }

      // Pending requests → show live overstock
      if (row.status === "PENDING" && row.location) {
        grouped[row.id].overstock_locations.push({
          id: row.overstock_id,
          location: row.location,
          quantity: row.quantity,
        });
      }
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get restock requests" });
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

    res
      .status(201)
      .json({ message: "Restock request created", restockRequest: newRequest });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH complete request
router.patch("/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { batches } = req.body; // array of { overstock_id, quantity }

  if (!batches || !Array.isArray(batches) || batches.length === 0) {
    return res.status(400).json({ error: "Batches are required." });
  }

  try {
    const request = await db("restock_requests").where({ id }).first();
    if (!request)
      return res.status(404).json({ error: "Restock request not found." });

    let totalDelivered = 0;
    const pulledSnapShot = [];

    await db.transaction(async (trx) => {
      for (const batch of batches) {
        const { overstock_id, quantity } = batch;

        const overstock = await trx("overstock")
          .where({ id: overstock_id })
          .first();
        if (!overstock)
          throw {
            status: 404,
            message: `Overstock batch ${overstock_id} not found`,
          };
        if (overstock.quantity < quantity)
          throw {
            status: 400,
            message: `Not enough quantity in batch ${overstock_id}`,
          };

        pulledSnapShot.push({
          overstock_id,
          location: overstock.location,
          quantity,
          total_quantity: overstock.quantity,
        });

        // decrement the batch
        const newQty = overstock.quantity - quantity;
        if (newQty === 0) {
          await trx("overstock").where({ id: overstock_id }).del();
        } else {
          await trx("overstock")
            .where({ id: overstock_id })
            .update({ quantity: newQty });
        }

        totalDelivered += quantity;
      }

      // update restock request
      await trx("restock_requests")
        .where({ id })
        .update({
          status: "DELIVERED",
          delivered_quantity: totalDelivered,
          pulled_from_location: JSON.stringify(pulledSnapShot), // store location names
          completed_at: trx.fn.now(),
        });
    });

    res.json({
      message: "Restock request completed successfully",
      totalDelivered,
    });
  } catch (err) {
    console.error(err);
    res
      .status(err.status || 500)
      .json({ error: err.message || "Internal server error" });
  }
});

// DELETE restock request
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const existing = await db("restock_requests").where({ id }).first();
    if (!existing)
      return res.status(404).json({ error: "Restock request not found." });

    await db("restock_requests").where({ id }).del();
    res.json({ message: `Restock request ${id} deleted successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete restock request" });
  }
});

module.exports = router;
