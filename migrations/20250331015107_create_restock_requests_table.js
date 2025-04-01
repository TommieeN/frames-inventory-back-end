// restock_requests table
exports.up = function (knex) {
  return knex.schema.createTable("restock_requests", (table) => {
    table.increments("id").primary();
    table.integer("frame_id").unsigned().notNullable();
    table.integer("quantity_requested").unsigned().notNullable();
    table.string("picking_location").notNullable(); // Where frames need to be delivered
    table.enu("status", ["PENDING", "COMPLETED"]).defaultTo("PENDING");
    table.timestamp("requested_at").defaultTo(knex.fn.now()).onUpdate(knex.fn.now());

    table.foreign("frame_id").references("id").inTable("frames").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("restock_requests");
};
