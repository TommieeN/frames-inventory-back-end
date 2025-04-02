// pulls table
exports.up = function (knex) {
  return knex.schema.createTable("pulls", (table) => {
    table.increments("id").primary();
    table.integer("frame_id").unsigned().notNullable();
    table.string("overstock_location").notNullable(); // Location where frames are pulled from
    table.integer("quantity_pulled").unsigned().notNullable();
    table.string("delivered_to").notNullable(); // Where frames were delivered
    table.timestamp("pulled_at").defaultTo(knex.fn.now());

    table.foreign("frame_id").references("id").inTable("frames").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("pulls");
};
