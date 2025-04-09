exports.up = function (knex) {
  return knex.schema.createTable("frames", (table) => {
    table.bigInteger("upc").primary().unsigned();
    table.string("sku").notNullable();
    table.string("description").notNullable();
    table.string("color_code").notNullable();
    table.string("brand").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("frames");
};