exports.up = function (knex) {
  return knex.schema.createTable("overstock", (table) => {
    table.bigIncrements("id").primary();
    table.bigInteger("upc").unsigned().notNullable();
    table.string("location").notNullable();
    table.integer("quantity").unsigned().notNullable();
    table.date("date_received").notNullable();

    table.foreign("upc").references("upc").inTable("frames").onDelete("CASCADE");
  });
};


exports.down = function (knex) {
  return knex.schema.dropTableIfExists("overstock");
};
