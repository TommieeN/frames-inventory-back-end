exports.up = function (knex) {
  return knex.schema.createTable("overstock", (table) => {
    table.increments("id").primary();
    table.integer("frame_id").unsigned().notNullable();
    table.string("location").notNullable();
    table.integer("qty_left").unsigned().defaultTo(0);
    table.timestamp("last_updated").defaultTo(knex.fn.now());

    table
      .foreign("frame_id")
      .references("id")
      .inTable("frames")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("overstock");
};
