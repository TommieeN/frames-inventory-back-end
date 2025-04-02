const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");

exports.seed = async function (knex) {
  await knex("frames").del();

  const framesData = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "../data/framesData.csv"))
    .pipe(csv())
    .on("data", (row) => {
      framesData.push({
        upc: row.UPC,
        sku: row.SKU,
        description: row.Description,
        color_code: row["Color Code"],
        brand: row.Brand,
      })
    })
    .on("end", async() => {
      await knex("frames").insert(framesData);
      console.log("Frames data seeded succesfully");
      resolve()
    })
    .on("error", (error) => reject(error));
  })
}