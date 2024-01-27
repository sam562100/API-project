// backend/config/database.js
const config = require('./index');

module.exports = {
  development: {
    storage: config.dbFile,
    dialect: "sqlite",
    seederStorage: "sequelize",
    logQueryParameters: true,
    typeValidation: true
  },
  production: {
    use_env_variable: 'postgres://sarinamak_db_user:xxvUlHsRpu9ahyrlgmO7SiWD1hDTGKq2@dpg-cmqbi7021fec739l22h0-a/sarinamak_db'/*'DATABASE_URL'*/,
    dialect: 'postgres',
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
