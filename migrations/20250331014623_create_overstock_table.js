exports.up = function (knex) {
  return knex.schema.createTable("overstock", (table) => {
    table.increments("id").primary();
    table.string("upc").notNullable(); // Change to string
    table.string("location").notNullable();
    table.integer("quantity").unsigned().defaultTo(0);
    table.timestamp("last_updated").defaultTo(knex.fn.now());

    table
      .foreign("upc")
      .references("upc") // Reference upc in frames, not id
      .inTable("frames")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("overstock");
};
