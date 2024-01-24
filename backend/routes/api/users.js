// backend/routes/api/users.js

//1. Create and export an Express router from this file.
const express = require('express')//1

//2. User Signup API Route
const bcrypt = require('bcryptjs'); //2
const { setTokenCookie, requireAuth } = require('../../utils/auth'); //2
const { User } = require('../../db/models');//2
const router = express.Router();//1

// Sign up
router.post(
    '/',
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
