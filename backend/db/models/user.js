'use strict';

const { Model, Validator } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.Spot, { foreignKey: 'ownerId' });
      User.hasMany(models.Booking, { foreignKey: 'userid' });
      User.hasMany(models.Review, { foreignKey: 'userId' });
    }
  };

  User.init(
    {
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: 'First Name is required'
          },
          notNull: {
            msg: 'First Name is required'
          }
        }
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            args: true,
            msg: 'Last Name is required'
          },
          notNull: {
            msg: 'First Name is required'
          }
        }
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: 'User with that email already exists'
        },
        validate: {
          len: [3, 256],
          isEmail: true,
          notEmpty: {
            args: true,
            msg: 'Invalid email'
          }
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: 'User with that username already exists'
        },
        validate: {
          len: {
            args: [4, 30],
            msg: 'Username is required'
          },
          notEmpty: {
            args: true,
            msg: 'Username is required'
          },
          notNull: {
            msg: 'First Name is required'
          },
          isNotEmail(value) {
            if (Validator.isEmail(value)) {
              throw new Error("Cannot be an email.");
            }
          },
        },
      },
      hashedPassword: {
        type: DataTypes.STRING.BINARY,
        allowNull: false,
        validate: {
          len: [60, 60]
        },
      },
    },
    {
      sequelize,
      modelName: "User",
      defaultScope: {
        attributes: {
          exclude: ["hashedPassword", "email", "createdAt", "updatedAt"]
        }
      }
    }
  );
  return User;
};
