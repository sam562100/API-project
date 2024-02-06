// backend/routes/api/index.js
const router = require('express').Router();
const sessionRouter = require('./session.js');
const usersRouter = require('./users.js');
const spotsRouter = require('./spots.js');
const bookingsRouter = require('./bookings.js');
const reviewsRouter = require('./reviews.js');
const reviewImagesRouter = require('./review-images.js');
const spotImagesRouter = require('./spot-images.js');
const { restoreUser } = require("../../utils/auth.js"); //restore user middleware

// Connect restoreUser middleware to the API router
  // If current user session is valid, set req.user to the user in the database
  // If current user session is not valid, set req.user to null
router.use(restoreUser); //global middleware *needs to be above other routers

router.use('/session', sessionRouter);

router.use('/users', usersRouter);

router.use('/spots', spotsRouter);

router.use('/bookings', bookingsRouter);

router.use('/reviews', reviewsRouter);

router.use('/review-images', reviewImagesRouter);

router.use('/spot-images', spotImagesRouter);

router.post('/test', (req, res) => {
  res.json({ requestBody: req.body });
});

module.exports = router;
