// backend/utils/validation.js
const { validationResult } = require('express-validator');

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, _res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const errors = {};
    validationErrors
      .array()
      .forEach(error => errors[error.path] = error.msg);

    const err = Error("Bad request.");
    err.errors = errors;
    err.status = 400;
    err.title = "Bad request.";
    next(err);
  }
  next();
};

function spotFormat(spotsArray, image = false, rateSpot = true) {
  spotsArray.forEach((el, i) => {
      const { Reviews, SpotImages } = el.dataValues;
      const mySpot = spotsArray[i].dataValues;
      if (rateSpot) avgStarRating(Reviews, mySpot);
      if (image) previewImage(SpotImages, mySpot);
  })
}

function avgStarRating(Reviews, spotDataValues) {
  let sum = 0;
  if (Reviews && Reviews.length) {
    sum = Reviews.reduce((sum1, el) => sum1 + el.dataValues.stars, 0);
    spotDataValues.avgStarRating = sum / Reviews.length;
  } else {
    spotDataValues.avgStarRating = 0;
  } delete spotDataValues.Reviews;
}

function previewImage (SpotImages, spotDataValues) {
  const url = SpotImages.length ? SpotImages[0].dataValues.url : "no images";
    spotDataValues.previewImage = url;
    delete spotDataValues.SpotImages;
}

function conflicts(spotArray, datesObj) {
  const { startDate, endDate } = datesObj;
  // const start = new Date(startDate);
  // const end = new Date(endDate);

  const errors = {};
  spotArray.forEach((el) => {
      const { startDate: oldStart, endDate: oldEnd } = el;
      // const oldStartDate = new Date(oldStart);
      // const oldEndDate = new Date(oldEnd);

      if (
        new Date(oldStart) >= new Date(startDate) && new Date(oldStart) <= new Date(endDate)
      ) {
        errors.endDate = "End date conflicts with an existing booking";
      }

      if (
        new Date(startDate) >= new Date(oldStart) && new Date(startDate) <= new Date(oldEnd)
      ) {
        errors.startDate = "Start date conflicts with an existing booking";
      }
  });

  if (errors.startDate || errors.endDate) {
		const err = new Error(
			"Sorry, this spot is already booked for the specified dates",
		);
		err.errors = errors;
		err.status = 403;
		throw err;
	}
}

module.exports = { handleValidationErrors, spotFormat, conflicts };
