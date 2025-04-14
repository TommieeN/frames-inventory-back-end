exports.up = function (knex) {
  return knex.schema.createTable("restock_requests", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("upc").unsigned().notNullable();
    table.enu("status", ["PENDING", "DELIVERED"]).defaultTo("PENDING");
    table.timestamp("requested_at").defaultTo(knex.fn.now());
    table.timestamp("completed_at").nullable();
    table.integer("delivered_quantity").unsigned().nullable();
    table.string("pulled_from_location").nullable();

    table
      .foreign("upc")
      .references("upc")
      .inTable("frames")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("restock_requests");
};
