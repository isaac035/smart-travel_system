const { convert } = require("html-to-text");
const axios = require("axios");
const Location = require("../models/Location");
const Hotel = require("../models/Hotel");
const Guide = require("../models/Guide");
const TourPackage = require("../models/TourPackage");
const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMessage = message.toLowerCase();

        // =========================
        // HOTEL SEARCH
        // =========================
        if (lowerMessage.includes("hotel")) {

            let city = "";

            if (lowerMessage.includes("colombo")) {
                city = "colombo";
            } else if (lowerMessage.includes("dambulla")) {
                city = "dambulla";
            } else if (lowerMessage.includes("moratuwa")) {
                city = "moratuwa";
            }

            const hotel = await Hotel.findOne({
                location: {
                    $regex: city,
                    $options: "i"
                }
            });

            if (!hotel) {
                return res.json({
                    success: false,
                    reply: "No hotel found"
                });
            }

            const hotelPrompt = `
You are a tourism assistant for a Sri Lankan travel website.

Rules:
- Be friendly.
- Keep answers under 150 words.
- Do not write letters.
- Do not say "Dear Guest".
- Do not add greetings or signatures.
- Give direct travel recommendations.

Hotel Name:
${hotel.name}

Location:
${hotel.location}

Description:
${hotel.description}

Price Per Night:
LKR ${hotel.pricePerNight}

Recommend this hotel.
`;

            const aiResponse = await axios.post(
                "http://localhost:11434/api/generate",
                {
                    model: "phi3:mini",
                    prompt: hotelPrompt,
                    stream: false
                }
            );

            return res.json({
                success: true,
                reply: aiResponse.data.response
            });
        }

        // =========================
        // LOCATION SEARCH
        // =========================
        const location = await Location.findOne({
            name: { $regex: message, $options: "i" }
        });

        if (!location) {
            return res.json({
                success: false,
                reply: "Location not found"
            });
        }

        const cleanDescription = convert(
            location.description,
            {
                wordwrap: false
            }
        );

        const locationPrompt = `
You are a Sri Lankan tourism assistant.

Use ONLY the information below.

Location Name:
${location.name}

Description:
${cleanDescription}

Explain this place to a tourist in a friendly way.
`;

        const aiResponse = await axios.post(
            "http://localhost:11434/api/generate",
            {
                model: "phi3:mini",
                prompt: locationPrompt,
                stream: false
            }
        );

        return res.json({
            success: true,
            reply: aiResponse.data.response
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            reply: "Server Error"
        });
    }
});

module.exports = router;