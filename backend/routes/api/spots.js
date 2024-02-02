//1. Create and export an Express router from this file.
const express = require('express') //1
//2. User Login API Route
const { Op } = require('sequelize'); //2 import sequelize operators
const bcrypt = require('bcryptjs'); //2 import bcrypt


const { setTokenCookie, restoreUser } = require('../../utils/auth'); //2
const { User } = require('../../db/models'); //2

//3. Validating Login Request Body
const { check } = require('express-validator'); //3
const { handleValidationErrors } = require('../../utils/validation'); //3

const router = express.Router();//1
