'use strict';

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

module.exports = {
  async up (queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    return queryInterface.bulkInsert(options, [
      {
        userId: 1,
        spotId: 1,
        review: 'This was an awesome spot!',
        stars: 5
      },
      {
        userId: 2,
        spotId: 2,
        review: 'This was an awesome spot!',
        stars: 5
      },
      {
        userId: 3,
        spotId: 3,
        review: 'This was an awesome spot!',
        stars: 5
      }
    ], { validate: true })
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Reviews';
    return queryInterface.bulkDelete(options);
  }
};
