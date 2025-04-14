require("dotenv").config();
const express = require("express");
const db = require("./db");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json());

// app.use("/restock-requests", restockRequestRoutes);

app.get("/", (req, res) => {
  res.send("Frames Inventory API is running!");
});

app.get("/frames", async (req, res) => {
  try {
    const frames = await db("frames").select("*");
    res.json(frames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch frames" });
  }
});

app.get("/frames/:upc", async (req, res) => {
  try {
    const { upc } = req.params;
    const frame = await db("frames").where({ upc }).first();

    if (!frame) {
      return res.status(404).json({ error: "Frame not found" });
    }

    res.json(frame);
  } catch (error) {
    console.error("Error fetching frame:", error);
    res.status(500).json({ error: "Failed to fetch frame" });
  }
});

// Adding frames that don't exist to the database
app.post("/frames", async (req, res) => {
  const { upc, sku, name, color, brand } = req.body;

  if (!upc || !sku || !name || !brand) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const [id] = await db("frames").insert({ upc, sku, name, color, brand });
    res.json({ message: "Frame added succesfully", id });
  } catch (error) {
    res.status(500).json({ error: "Failed to add frame" });
  }
});

app.get("/frames-overstock", async (req, res) => {
  try {
    const overstockData = await db("overstock")
      .join("frames", "overstock.upc", "=", "frames.upc")
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
      .orderBy("overstock.location", "asc"); // Sort location descending order

    res.json(overstockData);
  } catch (error) {
    console.error("Error fetching overstock data:", error);
    res.status(500).json({ error: "Failed to fetch frames overstock data" });
  }
});

app.post("/frames-overstock", async (req, res) => {
  const { upc, quantity, location } = req.body;

  if (!upc || !quantity || !location) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    await db("overstock").insert({
      upc,
      location,
      quantity,
    });
    res.json({ message: `${upc} stored succesfully at ${location}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to store overstock data" });
  }
});

// GET route for list of requests
app.get("/restock-requests", async (req, res) => {
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

    // Group overstock locations by request id
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
    console.error("Error getting requests:", err);
    res.status(500).json({ error: "Failed to get requests" });
  }
});

// POST /restock-requests
app.post("/restock-requests", async (req, res) => {
  const { upc } = req.body;

  if (!upc) {
    return res.status(400).json({ error: "UPC is required." });
  }

  try {
    // Optionally: validate UPC exists in frames table
    const frame = await db("frames").where({ upc }).first();
    if (!frame) {
      return res.status(404).json({ error: "Frame with this UPC not found." });
    }

    const newRequest = await db("restock_requests").insert({ upc });
    res.status(201).json({ message: "Restock request created." });
  } catch (err) {
    console.error("Error creating request:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// PATCH /restock-requests/:id/complete
app.patch("/restock-requests/:id/complete", async (req, res) => {
  const { id } = req.params;
  const { delivered_quantity, pulled_from_location } = req.body;

  if (!delivered_quantity || !pulled_from_location) {
    return res.status(400).json({ error: "Quantity and location required." });
  }

  try {
    const request = await db("restock_requests").where({ id }).first();

    if (!request) {
      return res.status(404).json({ error: "Restock request not found." });
    }

    // Update request status
    await db("restock_requests").where({ id }).update({
      status: "DELIVERED",
      delivered_quantity,
      pulled_from_location,
      completed_at: db.fn.now(),
    });

    // Update overstock quantity (subtract delivered_quantity from correct location)
    const overstock = await db("overstock")
      .where({
        upc: request.upc,
        location: pulled_from_location,
      })
      .first();

    if (!overstock) {
      return res.status(404).json({ error: "Overstock location not found." });
    }

    if (overstock.quantity < delivered_quantity) {
      return res
        .status(400)
        .json({ error: "Not enough quantity in overstock." });
    }

    await db("overstock")
      .where({
        upc: request.upc,
        location: pulled_from_location,
      })
      .decrement("quantity", delivered_quantity);

    res.json({
      message: "Restock request marked as delivered and overstock updated.",
    });
  } catch (err) {
    console.error("Error completing request:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

app.put("/restock-requests/:id/complete", async (req, res) => {
  const { delivered_quantity, pulled_from_location } = req.body;
  const { id } = req.params;

  try {
    // Update request
    await db("restock_requests")
      .where({ id })
      .update({
        status: "DELIVERED",
        completed_at: db.fn.now(),
        delivered_quantity,
        pulled_from_location,
      });

    // Update overstock quantity
    const current = await db("overstock")
      .where({
        upc: db("restock_requests").select("upc").where({ id }),
        location: pulled_from_location,
      })
      .first();

    if (current) {
      await db("overstock")
        .where({ upc: current.upc, location: pulled_from_location })
        .update({
          quantity: Math.max(current.quantity - delivered_quantity, 0),
        });
    }

    res.json({ message: "Request completed and overstock updated." });
  } catch (err) {
    console.error("Error completing request:", err);
    res.status(500).json({ error: "Failed to complete request." });
  }
});


const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
