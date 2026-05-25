require("dotenv").config();
const express = require("express");
const cors = require("cors");
const framesRoutes = require("./routes/frames");
const overstockRoutes = require("./routes/overstock");
const restockRoutes = require("./routes/restockRequests");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Frames Inventory API is running!");
});

// Mount routes
app.use("/frames", framesRoutes);
app.use("/frames-overstock", overstockRoutes);
app.use("/restock-requests", restockRoutes);

const PORT = process.env.PORT || 3333;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
