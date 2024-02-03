'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Review extends Model {

    static associate(models) {
      Review.belongsTo(models.User, { foreignKey: 'userId' });
      Review.belongsTo(models.Spot, { foreignKey: 'spotId' });
      Review.hasMany(models.ReviewImage, { foreignKey: 'reviewId' });
    }
  }
  Review.init({
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    spotId: {
      type: DataTypes.INTEGER,
      allowNull: false

    },
    review: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: 'Review text is required' },
        notEmpty: { msg: 'Review text is required' }
      }
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: 'Stars must be an integer from 1 to 5' },
        min: {
          args: 1,
          msg: 'Stars must be an integer from 1 to 5'
        },
        max: {
          args: 5,
          msg: 'Stars must be an integer from 1 to 5'
        }
      }
    }
  }, {
    sequelize,
    modelName: 'Review',
  });
  return Review;
};
