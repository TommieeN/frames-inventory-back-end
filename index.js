require("dotenv").config();
const express = require("express");
const db = require("./db");

const app = express()
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Frames Inventory API is running!");
});

app.get("/frames", async (req, res) => {
    try {
        const frames = await db("frames").select("*");
        res.json(frames);
        console.log(frames)
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to fetch frames" });
    }
})

app.post("/frames", async (req, res) => {
    const { upc, sku, name, color, type } = req.body;

    if (!upc || !sku || !name || !type) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    try {
        const [id] = await db("frames"). insert({ upc, sku, name, color, type });
        res.json({ message: "Frame added succesfully", id });
    } catch (error) {
        res.status(500).json({ error: "Failed to add frame" })
    }
});

const PORT = 3333;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
