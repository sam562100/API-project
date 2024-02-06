const express = require('express')
const router = express.Router();
const { Spot, SpotImage } = require('../../db/models');
const { requireAuth } = require("../../utils/auth");

//Delete spot image
router.delete("/:id", requireAuth, async (req, res, next) => {
    const { id: spotImageId } = req.params;
    const { id: userId } = req.user;

    try {
      const mySpotImage = await SpotImage.findByPk(spotImageId, { include: Spot });
      if (!mySpotImage) {
        return res.status(404).json({ message: "Spot Image couldn't be found" });
      }

      if (!mySpotImage.Spot || Number(userId) !== Number(mySpotImage.Spot.ownerId)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      await mySpotImage.destroy();
      return res.json({ message: "Successfully deleted" });
    } catch (err) {
      return next(err);
    }
  });

module.exports = router;
