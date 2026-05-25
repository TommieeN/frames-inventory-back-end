exports.seed = async function (knex) {
  await knex("restock_requests").del();

  await knex("restock_requests").insert([
    {
      upc: 100000100001,
      status: "PENDING",
      requested_at: new Date(),
    },
    {
      upc: 100000100016,
      status: "PENDING",
      requested_at: new Date(),
    },
    {
      upc: 100000100041,
      status: "DELIVERED",
      requested_at: new Date(Date.now() - 1000 * 60 * 60 * 24),
      completed_at: new Date(),
      delivered_quantity: 5,
      pulled_from_location: JSON.stringify([
        { overstock_id: 7, location: "C-01", quantity: 5, total_quantity: 12 },
      ]),
    },
  ]);

  console.log("Restock requests seeded successfully");
};
