// backend/routes/api/users.js

//1. Create and export an Express router from this file.
const express = require('express')//1

//2. User Signup API Route
const bcrypt = require('bcryptjs'); //2
//3. Validating Signup Request Body
const { check } = require('express-validator');//3
const { handleValidationErrors } = require('../../utils/validation');//3
const { setTokenCookie, requireAuth } = require('../../utils/auth'); //2
const { User } = require('../../db/models');//2

const router = express.Router();//1

//Validate Signup Middleware
const validateSignup = [
  check('email')
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage('Please provide a valid email.'),
  check('username')
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage('Please provide a username with at least 4 characters.'),
  check('username')
    .not()
    .isEmail()
    .withMessage('Username cannot be an email.'),
  check('password')
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage('Password must be 6 characters or more.'),
  handleValidationErrors
];


// Sign up
router.post(
    '/',
    validateSignup, 
    async (req, res) => {
      const { email, password, username } = req.body;
      const hashedPassword = bcrypt.hashSync(password);
      const user = await User.create({ email, username, hashedPassword });

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

module.exports = router;//1
