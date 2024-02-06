const express = require('express')
const router = express.Router();
const { Review, ReviewImage, Spot, SpotImage, User } = require('../../db/models');
const { handleValidationErrors, spotFormat, conflicts } = require('../../utils/validation');
const { requireAuth } = require("../../utils/auth");
const { environment } = require("../../config");
const isProduction = environment === "production";

const testAuthorization = async (req, res, next) => {
    const { id: userId } = req.user;
    const { reviewId } = req.params;

    try {
        const myReview = await Review.findByPk(reviewId);

        if (!myReview) {
            return res.status(404).json({"message": "Review couldn't be found"});
        }

        const { userId: ownerId } = myReview;

        if (Number(userId) !== Number(ownerId)) throw new Error('Forbidden');
    } catch (err) {
        return next(err);
    }
    return next();
};

//Get Reviews

router.get('/current', requireAuth, async (req, res, next) => {
	const { id: userId } = req.user;
	const where = { userId: userId };
	const include = [
		{ model: User },
		{
			model: Spot,
			attributes: {
				exclude: ["description", "updatedAt", "createdAt"],
			},
			include: SpotImage
		},
		{ model: ReviewImage },
	];

	try {
		const Reviews = await Review.findAll({ where, include });

        // Reviews.forEach((el) => {
        //     const { Spot } = el;
        // })

		res.json({ Reviews });
	} catch (err) {
		return next(err);
	}
});

//Post review image
router.post('/:reviewId/images', requireAuth, testAuthorization, async (req, res, next) => {
    const { url } = req.body;
    const { reviewId } = req.params;
    const where = { reviewId: reviewId };
    const payload = { reviewId: reviewId, url: url }

    try {
        const limit = await ReviewImage.count({ where });
        if (limit >= 10) {
            res.status(403).json({"message": "Maximum number of images for this resource was reached"})
        }
        const { id } = await ReviewImage.create(payload);
        return res.json({ id, url });
    } catch (err) {
        return next(err);
    }
});

//Edit a review
router.put("/:reviewId", requireAuth, testAuthorization, async (req, res, next) => {
    const { review, stars } = req.body;
    const { reviewId } = req.params;
    const payload = { review: review, stars: stars };
    const options = { where: { id: reviewId }, returning: true, plain: true }

    try {

        const updatedReview = await Review.update(payload, options);

        if (!isProduction) {
            updatedReview.sqlite = await Review.findByPk(reviewId);
        }

        return res.json(updatedReview.sqlite || updatedReview[1].dataValues);

    } catch (err) {

        return res.status(400).json(err);
    }
});

//Delete review
router.delete('/:reviewId', requireAuth, testAuthorization, async (req, res, next) => {
		const { reviewId } = req.params;
        const where = { id: reviewId }

		try {
			await Review.destroy({ where });

			return res.json({ message: "Successfully deleted" });
		} catch (err) {
			return next(err);
		}
	},
);

module.exports = router;
