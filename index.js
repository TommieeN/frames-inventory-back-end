require("dotenv").config();
const express = require("express");
const db = require("./db");
const cors = require("cors");
const restockRequestRoutes = require("./routes/restockRequests");


const app = express();

app.use(cors());

app.use(express.json());

app.use("/restock-requests", restockRequestRoutes);

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
    console.error(error)
    res.status(500).json({ error: "Failed to store overstock data" });
  }
});

app.get("/restock-requests", async (req, res) => {
  try {
    const requests = await db("restock_requests")
      .join("frames", "restock_requests.upc", "frames.upc")
      .select(
        "restock_requests.id",
        "restock_requests.upc",
        "restock_requests.quantity_requested",
        "restock_requests.status",
        "restock_requests.requested_at",
        "frames.sku",
        "frames.description",
        "frames.color_code",
        "frames.brand"
      )
      .where("restock_requests.status", "PENDING")
      .orderBy("restock_requests.requested_at", "asc");

    res.json(requests);
  } catch (err) {
    console.error("Error fetching restock requests:", err);
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

app.post("/restock-requests", async (req, res) => {
  const { upc, quantity_requested } = req.body;

  try {
    await db("restock_requests").insert({
      upc,
      quantity_requested,
    });

    res.status(201).json({ message: "Restock request created" });
  } catch (err) {
    console.error("Error inserting restock request:", err);
    res.status(500).json({ error: "Failed to create request" });
  }
});

const PORT = 3333;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
