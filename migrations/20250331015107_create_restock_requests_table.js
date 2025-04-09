exports.up = function (knex) {
  return knex.schema.createTable("restock_requests", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("upc").unsigned().notNullable();
    table.integer("quantity_requested").unsigned().notNullable();
    table.enu("status", ["PENDING", "DELIVERED"]).defaultTo("PENDING");
    table.timestamp("requested_at").defaultTo(knex.fn.now());

    table.foreign("upc").references("upc").inTable("frames").onDelete("CASCADE");
  });
};


exports.down = function (knex) {
  return knex.schema.dropTableIfExists("restock_requests");
};
