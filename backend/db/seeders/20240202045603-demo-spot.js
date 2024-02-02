'use strict';

// const { User } = require('../models');
// const bcrypt = require("bcryptjs");
const { Spot } = require('../models');

let options = {};
if (process.env.NODE_ENV === 'production') {
  options.schema = process.env.SCHEMA;  // define your schema in options object
}

/* @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    try {
      await Spot.bulkCreate([
        {
          "ownerId": 1,
          "address": "123 Disney Lane",
          "city": "San Francisco",
          "state": "California",
          "country": "United States of America",
          "lat": 37.7645358,
          "lng": -122.4730327,
          "name": "App Academy",
          "description": "Place where web developers are created",
          "price": 123,
        },
        {
          "ownerId": 2,
          "address": "456 Disney Lane",
          "city": "Los Angeles",
          "state": "California",
          "country": "United States of America",
          "lat": 38.7645358,
          "lng": -123.4730327,
          "name": "App Academy",
          "description": "Place where web developers are created",
          "price": 456,
        },
        {
          "ownerId": 3,
          "address": "789 Disney Lane",
          "city": "San Jose",
          "state": "California",
          "country": "United States of America",
          "lat": 39.7645358,
          "lng": -124.4730327,
          "name": "App Academy",
          "description": "Place where web developers are created",
          "price": 789,
        }
      ], { validate: true })
    } catch (err) {
      console.log(err);
      throw Error(err);
    }
  },

  async down (queryInterface, Sequelize) {
    options.tableName = 'Spots';
    const Op = Sequelize.Op;
    return queryInterface.bulkDelete(options, {
      address: { [Op.in]: ['123 Disney Lane', '456 Disney Lane', '789 Disney Lane'] }
    }, {})
  }
};
