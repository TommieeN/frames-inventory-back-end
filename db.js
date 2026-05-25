require("dotenv").config();
const knex = require("knex");

const db = knex({
    client: "pg",
    connection: process.env.DATABASE_URL || {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    },
});

module.exports = db;
