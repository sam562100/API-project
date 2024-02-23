const express = require('express')
const router = express.Router();
const { Review, ReviewImage } = require('../../db/models');
const { requireAuth } = require("../../utils/auth");

// Middleware ReviewImage authorization
const testAuthorization = async (req, res, next) => {
    const { id: userId } = req.user;
    const { id: reviewImageId } = req.params;
    const include = { model: Review };

    try {
        const spotImage = await ReviewImage.findByPk(reviewImageId, {include});

        if (!spotImage) res.status(404).json({ 'message': "Review Image couldn't be found" });

        const { userId: ownerId } = spotImage.Review;

        if (Number(userId) !== Number(ownerId)) throw new Error('Forbidden');

    } catch (err) {
        return next(err);
    }
    return next();
};

//Delete ReviewImage
router.delete('/:id', requireAuth, testAuthorization, async (req, res, next) => {
    const { id: reviewImageId } = req.params;
    const where = { id: reviewImageId };

    try {
        await ReviewImage.destroy({ where });
        return res.json({ message: "Successfully deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
