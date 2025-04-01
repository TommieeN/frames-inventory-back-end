exports.up = function (knex) {
  return knex.schema.createTable("frames", (table) => {
    table.increments("id").primary();
    table.string("upc").unique().notNullable();
    table.string("sku").notNullable();
    table.string("description").notNullable();
    table.string("color_code").notNullable();
    table.string("brand").notNullable();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("frames");
};
