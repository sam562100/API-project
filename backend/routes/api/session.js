// backend/routes/api/session.js

//1. Create and export an Express router from this file.
const express = require('express') //1
//2. User Login API Route
const { Op } = require('sequelize'); //2 import sequelize operators
const bcrypt = require('bcryptjs'); //2 import bcrypt
//3. Validating Login Request Body
const { check } = require('express-validator'); //3
const { handleValidationErrors } = require('../../utils/validation'); //3

const { setTokenCookie, restoreUser } = require('../../utils/auth'); //2
const { User } = require('../../db/models'); //2
const router = express.Router();//1

//3. validateLogin middleware that check the keys and validates them
const validateLogin = [
  check('credential')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Please provide a valid email or username.'),
  check('password')
    .exists({ checkFalsy: true })
    .withMessage('Please provide a password.'),
  handleValidationErrors
];

// Log in
router.post( //post request
    '/',
    validateLogin,
    async (req, res, next) => {
      const { credential, password } = req.body; //taking in credentional property and password property

      const user = await User.unscoped().findOne({
        where: {
          [Op.or]: { //using an or operator in the query to look for a record of an username or and email
            username: credential, //credential can be EITHER an username or an emial
            email: credential
          }
        }
      });
      //hashing password
      if (!user || !bcrypt.compareSync(password, user.hashedPassword.toString())) {
        const err = new Error('Login failed');
        err.status = 401;
        err.title = 'Login failed';
        err.errors = { credential: 'The provided credentials were invalid.' };
        return next(err);
      }

      const safeUser = {
        id: user.id,
        email: user.email,
        username: user.username,
      };

      await setTokenCookie(res, safeUser);

      return res.json({
        user: safeUser
      });
    }
  );

  // Log out
router.delete(
    '/',
    (_req, res) => {
      res.clearCookie('token');
      return res.json({ message: 'success' });
    }
  );

// Restore session user
router.get(
    '/',
    (req, res) => {
      const { user } = req;
      if (user) {
        const safeUser = {
          id: user.id,
          email: user.email,
          username: user.username,
        };
        return res.json({
          user: safeUser
        });
      } else return res.json({ user: null });
    }
  );

module.exports = router;//1
