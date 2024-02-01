// backend/config/database.js
const config = require('./index');

module.exports = {
  development: {
    storage: config.dbFile,
    dialect: "sqlite", //locally using sqlite3
    seederStorage: "sequelize",
    logQueryParameters: true,
    typeValidation: true
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: 'postgres', //remotely on production environment using postgress
    seederStorage: 'sequelize',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      schema: process.env.SCHEMA
    }
  }
};
