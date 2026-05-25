exports.seed = async function (knex) {
  await knex("overstock").del();

  await knex("overstock").insert([
    { upc: 100000100001, location: "A-01", quantity: 12 },
    { upc: 100000100002, location: "A-02", quantity: 8 },
    { upc: 100000100010, location: "A-03", quantity: 5 },
    { upc: 100000100016, location: "B-01", quantity: 15 },
    { upc: 100000100026, location: "B-02", quantity: 3 },
    { upc: 100000100036, location: "B-03", quantity: 20 },
    { upc: 100000100041, location: "C-01", quantity: 7 },
    { upc: 100000100050, location: "C-02", quantity: 10 },
    { upc: 100000100060, location: "C-03", quantity: 6 },
    { upc: 100000100069, location: "D-01", quantity: 4 },
    { upc: 100000100074, location: "D-02", quantity: 9 },
    { upc: 100000100085, location: "D-03", quantity: 11 },
  ]);

  console.log("Overstock data seeded successfully");
};
