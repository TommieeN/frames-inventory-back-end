exports.up = function (knex) {
  return knex.schema.createTable("frames", (table) => {
    table.increments("id").primary();
    table.string("upc").unique().notNullable();
    table.string("sku").unique().notNullable();
    table.string("name").notNullable();
    table.string("color");
    table.enu("type", ["OPTICAL", "SUNGLASSES", "OTHER"]).notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("frames");
};
