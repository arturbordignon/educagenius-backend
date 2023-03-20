const express = require("express");
const { generateResponse } = require("../controllers/openAiController");
const router = express.Router();

router.post("/generateresponse", generateResponse);

module.exports = router;
