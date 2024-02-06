const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { setTokenCookie, restoreUser } = require('../../utils/auth');
const { check } = require('express-validator');
const { handleValidationErrors, spotFormat, conflicts } = require('../../utils/validation');
const { Booking, Review, ReviewImage, Spot, SpotImage, User, Sequelize } = require('../../db/models');
const { requireAuth } = require("../../utils/auth");
const { environment } = require("../../config");
const e = require('express');
const isProduction = environment === "production";

//Spots Authorization Middleware
const testAuthorization = async (req, res, next) => {
    const { id: userId } = req.user;
    const { id: spotId } = req.params;

    try {
        const mySpot = await Spot.findByPk(spotId);

        if (!mySpot) {
            return res.status(404).json({ "message": "Spot couldn't be found" });
        } else {
            if (Number(userId) !== Number(mySpot.toJSON().ownerId)) {
                res.status(403).json({ "message": "Forbidden" });
            }
        }
    } catch (err) {
        return next(err);
    }
    next();
};

//Validate Query Filters
const validateQueryFilters = [
	check("page")
		.default(1)
		.isInt({ min: 1, max: 10 })
		.withMessage("Page must be greater than or equal to 1"),
	check("size")
		.default(20)
		.isInt({ min: 1, max: 20 })
		.withMessage("Size must be greater than or equal to 1"),
		check("minLat")
		.optional()
		.isFloat({ min: -90, max: 90 })
		.withMessage("Minimum latitude is invalid; must be between -90 and 90."),
	check("maxLat")
		.optional()
		.isFloat({ min: -90, max: 90 })
		.withMessage("Maximum latitude is invalid; must be between -90 and 90."),
	check("minLng")
		.optional()
		.isFloat({ min: -180, max: 180 })
		.withMessage("Minimum longitude is invalid; must be between -180 and 180."),
	check("maxLng")
		.optional()
		.isFloat({ min: -180, max: 180 })
		.withMessage("Maximum longitude is invalid; must be between -180 and 180."),
	check("minPrice")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("Minimum price must be greater than or equal to 0"),
	check("maxPrice")
		.optional()
		.isFloat({ min: 0 })
		.withMessage("Maximum price must be greater than or equal to 0"),
	handleValidationErrors,
];

//Pagination
function paginationBuilder(page = 1, size = 10) {
    page = Math.max(1, parseInt(page, 10));
    size = Math.min(Math.max(1, parseInt(size, 10)), 100);
    const pagination = {
        limit: size,
        offset: size * (page - 1),
    };

    return pagination;
}

//Get all Spots
router.get('/', validateQueryFilters, async (req, res, next) => {
	let {page} = parseInt(req.query.page) || 1;
	let {size} = parseInt(req.query.size) || 20;
	const {minLat} = parseFloat(req.query.minLat);
	const {maxLat} = parseFloat(req.query.maxLat);
	const {minLng} = parseFloat(req.query.minLng);
	const {maxLng} = parseFloat(req.query.maxLng);
	const {minPrice} = parseFloat(req.query.minPrice);
	const {maxPrice} = parseFloat(req.query.maxPrice);
	const include = [{ model: Review }, { model: SpotImage }];
	const where = {};

	if (minLat && maxLat) {
		where.lat = {
			[Op.and]: {
				[Op.gt]: minLat,
				[Op.lt]: maxLat,
			},
		};
	} else if (minLat) where.lat = { [Op.gt]: minLat };
	else if (maxLat) where.lat = { [Op.lt]: maxLat };

	if (minLng && maxLng) {
		where.lng = {
			[Op.and]: {
				[Op.gt]: minLng,
				[Op.lt]: maxLng,
			},
		};
	} else if (minLng) where.lng = { [Op.gt]: minLng };
	else if (maxLng) where.lng = { [Op.lt]: maxLng };

	if (minPrice && maxPrice) {
		where.price = {
			[Op.and]: {
				[Op.gt]: minPrice,
				[Op.lt]: maxPrice,
			},
		};
	} else if (minPrice) where.price = { [Op.gt]: minPrice };
	else if (maxPrice) where.price = { [Op.lt]: maxPrice };

	const pagination = paginationBuilder(page, size);

	try {
		const Spots = await Spot.findAll({ include, where, ...pagination });

		spotFormat(Spots, true);

		return res.json({ Spots, page, size });

	} catch (err) {
		return next(err);
	}
});

//Get current spot
router.get('/current', requireAuth, async (req, res, next) => {
	const { id: userId } = req.user;
	const where = { ownerId: userId };
	const include = [
		{ model: Review },
		{ model: SpotImage }
	];

	try {
		const mySpots = await Spot.findAll({ where, include });

		spotFormat(mySpots, true);

		return res.json({ Spots: mySpots });

	} catch (err) {
		return next(err);
	}
});

//Get Details of a Spot by Id
router.get('/:id', async (req, res, next) => {
    const { id: spotId } = req.params;
    const include = [
        { model: Review },
        { model: SpotImage },
        { model: User, as: "Owner" },
    ];

    try {
        const spotDetails = await Spot.findByPk(spotId, { include });
        if (!spotDetails) {
            return res.status(404).json({ "message": "Spot couldn't be found" });
        }
		spotDetails.dataValues.numReviews = spotDetails.dataValues.Reviews.length;
        spotFormat([spotDetails]);

        return res.json(spotDetails);
    } catch (err) {
        return next(err);
    }
});

//Get All Reviews From SpotId
router.get('/:id/reviews', async (req, res, next) => {
	const { id: spotId } = req.params;
	const where = { spotId: spotId };
	const include = [
		{ model: User },
		{ model: ReviewImage },
	];

	try {
		const mySpot = await Spot.findByPk(spotId);

		if (!mySpot){
			return res.status(404).json({"message": "Spot couldn't be found"})
		}

		const Reviews = await Review.findAll({ where, include });

		return res.json({ Reviews });
	} catch (err) {
		return next(err);
	}
});

//Get All Bookings based on SpotId
router.get('/:id/bookings', requireAuth, async (req, res, next) => {
	const { id: userId } = req.user;
	const { id: spotId } = req.params;
	const include = {
		model: Booking,
		include: { model: User }
	};

	try {
		const mySpot = await Spot.findByPk(spotId, { include });

		if (!mySpot) {
			return res.status(404).json({"message": "Spot couldn't be found"})
		}

		const { ownerId, Bookings } = mySpot;

		if (ownerId !== userId) {
			Bookings.forEach((el, i) => {
				const { startDate, endDate } = el;
				Bookings[i] = { spotId, startDate, endDate };
			});
		}

		return res.json({ Bookings });
	} catch (err) {
		return next(err);
	}
});

//Create a Spot
router.post('/', requireAuth, async (req, res, next) => {
		const { id: userId } = req.user;

		const { address, city, state, country, lat, lng, name, description, price } = req.body;

		// const currentDate = new Date();
		const query = {
			ownerId: userId,
			address,
			city,
			state,
			country,
			lat,
			lng,
			name,
			description,
			price
		};
		try{
			const { dataValues } = await Spot.create( query );
			return res.status(201).json({
				id: userId,
				...dataValues
			});
		} catch (err) {
			err.status = 400;
			next(err)
		}

		return res.status(201).json(spot);
	});

// Create an Image for a Spot
router.post('/:id/images', requireAuth, testAuthorization,
	async (req, res, next) => {
		const { id: spotId } = req.params;
		const { url, preview } = req.body;
		const query = { spotId: spotId, url: url, preview: preview };

		try {
			const { id } = await SpotImage.create(query);
			return res.json({ id, url, preview });
		} catch (err) {
			return next(err);
		}
	},
);

//Create a Review with SpotId
router.post("/:id/reviews", requireAuth, async (req, res, next) => {
    const {id: userId} = req.user;
    const {id: spotId} = req.params;
    const { review, stars } = req.body;
	const where = { userId: userId, spotId: +spotId };
	const defaults = { review:review, stars: stars };

    try {
        const [newReview, created] = await Review.findOrCreate({
			where,
			defaults,
		});

		if (!created) throw new Error("User already has a review for this spot");

		return res.status(201).json(newReview);
    } catch (err) {
		if (err.message.toLowerCase().includes("foreign key constraint")) {
			res.status(404).json({"message": "Spot couldn't be found"});
		}
		return res.status(400), next(err);
    }
});

//Create Booking from SpotId
router.post('/:id/bookings', requireAuth, async (req, res, next) => {
    const { startDate, endDate } = req.body;
    const { id: spotId } = req.params;
    const { id: userId } = req.user;
	const where = { spotId: spotId };

    try {
        const mySpot = await Spot.findByPk(spotId);
        if (!mySpot) {
            return res.status(404).json({"message": "Spot couldn't be found"});
        }
		const { ownerId } = mySpot;
        if (Number(userId) === Number(ownerId)) throw new Error('Forbidden');

		const spotBookings = await Booking.findAll({ where });

		const dates = { startDate, endDate };
		conflicts(spotBookings, dates);

        if (new Date(startDate) <= new Date()) {
            throw new Error("Past bookings can't be modified");
        }

        const newBooking = await Booking.create({
            spotId,
            userId,
            startDate,
            endDate,
        });

        return res.status(201).json(newBooking);
    } catch (err) {
        if (err.message.toLowerCase().includes("foreign key constraint")) {
			throw new Error("Spot couldn't be found");
		}
		return next(err);
    }
});

//Edit spot
router.put('/:id', requireAuth, testAuthorization, async (req, res, next) => {
	const { id: spotId } = req.params;
	const { address, city, state, country, lat, lng, name, description, price } =
		req.body;
	const query = {
		address: address,
		city: city,
		state: state,
		country: country,
		lat: lat,
		lng: lng,
		name: name,
		description: description,
		price: price,
	};

	const options = {
		where: { id: spotId },
		returning: true,
		plain: true
	}

	try {
		const updatedSpot = await Spot.update(query, options);

		if (!isProduction) {
			updatedSpot.sqlite = await Spot.findByPk(spotId);
		}
		return res.json(updatedSpot.sqlite || updatedSpot[1].dataValues);
	} catch (err) {
		return res.status(400).json(err);
	}
});


//Delete a Spot
router.delete('/:id', requireAuth, async (req, res, next) => {
		const { id: spotId } = req.params;
		const { id: userId } = req.user;
		const mySpot = await Spot.findByPk(spotId);

		try {
			if (!mySpot) {
				return res.status(404).json({ "message": "Spot couldn't be found" });
			} else {
				if (Number(userId) !== Number(mySpot.toJSON().ownerId)) {
					res.status(403).json({ "message": "Forbidden" });
				} else {
					await mySpot.destroy();
					return res.json({ message: "Successfully deleted" });
				}
			}
		} catch (err) {
			return next(err);
		}
	},
);

module.exports = router; //1
