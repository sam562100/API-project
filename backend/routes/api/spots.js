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
const { Spot, User, Sequelize } = require('../../db/models');

const router = express.Router();//1

const { requireAuth } = require("../../utils/auth");
const { environment } = require("../../config");
const isProduction = environment === "production";

const testAuthorization = async (req, res, next) => {
	const { id: userId } = req.user;
	const { id: spotId } = req.params;

	try {
		const mySpot = await Spot.findByPk(spotId);

		if (!mySpot){
			res.status(404).json({"message": "Spot couldn't be found"})
		}

		const { ownerId } = mySpot;

		if (Number(userId) !== Number(ownerId)) throw new Error("Forbidden");
	} catch (err) {
		return next(err);
	}
	return next();
};

//Create a Spot
router.post(
    '/',
    async (req, res) => {
        const { id: userId } = req.user;

        const { address, city, state, country, lat, lng, name, description, price } = req.body;
        const spot = await Spot.create({
            ownerId: userId,
            address: address,
            city: city,
            state: state,
            country: country,
            lat: lat,
            lng: lng,
            name: name,
            description: description,
            price: price,
        });

        return res.status(201).json({
            id: userId,
            address: address,
            city: city,
            state: state,
            country: country,
            lat: lat,
            lng: lng,
            name: name,
            description: description,
            price: price,
        })
    }
)

module.exports = router; //1
