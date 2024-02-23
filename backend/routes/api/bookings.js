const express = require('express')
const router = express.Router();
const { Booking, Review, ReviewImage, Spot, SpotImage, User, Sequelize } = require('../../db/models');
const { handleValidationErrors, spotFormat, conflicts } = require('../../utils/validation');
const { requireAuth } = require("../../utils/auth");
const { environment } = require("../../config");
const isProduction = environment === "production";



// Booking Authorization
const testAuthorization = async (req, res, next) => {
    const { id: userId } = req.user;
    const { id: bookingId } = req.params;
    const include  = { model: Spot };

    try {
        const mybooking = await Booking.findByPk(bookingId, { include });
        console.log(mybooking);
        if (!mybooking ) return res.status(404).json({ 'message': "Booking couldn't be found" });

        const { userId: ownerId } = mybooking;

        if (req.method === 'DELETE') {
            const { startDate } = mybooking;
            const { ownerId: spotOwner } = mybooking.spot;

            if (new Date(startDate) < new Date()) {
                throw new Error("Bookings that have been started can't be deleted");
            }
            if (Number(userId) === Number(spotOwner)) return next();
        }
        if (Number(userId) !== Number(ownerId)) throw new Error('Forbidden');
    } catch (err) {
        return next(err);
    }

    return next();
}


//Get All Bookings
router.get('/current', requireAuth, async (req, res, next)=> {
    const { id: userId } = req.user;
    const where = { userId: userId };
    const include = {
        model: Spot,
        attributes: {
            exclude: ['description', 'updatedAt', 'createdAt'],
        },
        include: SpotImage,
    };

    try {
        const Bookings = await Booking.findAll({ where, include });
        Bookings.forEach( (el) => {

            const { Spot } = el;
            spotFormat([Spot], true, false);

        });

        return res.json({ Bookings })
    } catch (err) {
        return next(err)
    }
})

//Create Bookings /Edit Bookings
router.put('/:id', requireAuth, testAuthorization, async (req, res, next) => {
    const { startDate, endDate } = req.body;
    const { id : bookingId } = req.params;
    // console.log( " FIND CONSOLE LOG HERE ", bookingId, 'HELP');
    // const where = { id: bookingId };
    // const userId = req.user.id;
    try {
        const bookingToUpdate = await Booking.findByPk( bookingId );
        // console.log( id );
        console.log( bookingToUpdate );
        if (!bookingToUpdate) {
            return res.status(404).json({ message: "Booking couldn't be found" });
        }

        if (new Date(bookingToUpdate.endDate) < new Date()) {
            return res.status(403).json({ message: "Past bookings can't be modified" });
        }

        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ errors: { endDate: "End date cannot come before or on the start date", startDate: "Start date cannot be on the end date" } });
        }

        const otherBookings = await Booking.findAll({
            where: {
                spotId: bookingToUpdate.spotId,
                id: { [Sequelize.Op.ne]: bookingId }
            }
        });

        for(const other of otherBookings){
			if (new Date(startDate) <= new Date(other.endDate) && new Date(endDate) >= new Date(other.startDate)) {
				return res.status(403).json({
					message: "Sorry, this spot is already booked for the specified dates",
					errors: {
						startDate: "Start date conflicts with an existing booking",
						endDate: "End date conflicts with an existing booking"
					}
				});
			}
		}

        bookingToUpdate.startDate = startDate;
        bookingToUpdate.endDate = endDate;
        await bookingToUpdate.save();

        res.status(200).json(bookingToUpdate);

    } catch (err) {
        next(err);
    }
});

//Delete Booking
router.delete('/:bookingId', requireAuth, testAuthorization, async (req, res, next) => {
    const { bookingsId } = req.params;
    const where = { id: bookingsId };

    try {
        await Booking.destroy({ where });
        return res.json({ message: "Successfully deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;
