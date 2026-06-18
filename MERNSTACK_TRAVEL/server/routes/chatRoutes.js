const { convert } = require("html-to-text");
const axios = require("axios");
const Location = require("../models/Location");
const Hotel = require("../models/Hotel");
const Guide = require("../models/Guide");

const TourPackage = require("../models/TourPackage");
const express = require("express");

const router = express.Router();


async function extractCity(message) {

    const response = await axios.post(
        "http://localhost:11434/api/generate",
        {
            model: "phi3:mini",
            prompt: `
Extract only the city or destination name from this message.

Message:
${message}

Rules:
- Return only the city name.
- No explanation.
- No extra words.
- Example:
  recommend hotel in colombo -> Colombo
  find guide in anuradhapura -> Anuradhapura
`,
            stream: false
        }
    );

    return response.data.response
        .trim()
        .replace("The city is", "")
        .replace("City:", "")
        .trim();
}




router.post("/", async (req, res) => {
    try {
        const { message } = req.body;
        const lowerMessage = message.toLowerCase();

        // =========================
        // HOTEL SEARCH
        // =========================
        if (lowerMessage.includes("hotel")) {

           const city = await extractCity(message);

console.log("Detected City:", city);

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

        //Guide Search
        if (lowerMessage.includes("guide")) {

    const city = await extractCity(message);

console.log("Guide City:", city);

    const guide = await Guide.findOne({
        location: {
            $regex: city,
            $options: "i"
        }
    });

    if (!guide) {
        return res.json({
            success: false,
            reply: "No guide found"
        });
    }

    const guidePrompt = `
You are a tourism assistant.

Recommend this guide.

Guide Name:
${guide.name}

Location:
${guide.location}

Experience:
${guide.experience} years

Languages:
${guide.languages.join(", ")}

Bio:
${guide.bio}

Price Per Day:
${guide.pricePerDay} Sri Lankan Rupees

Give a short recommendation.
`;

    const aiResponse = await axios.post(
        "http://localhost:11434/api/generate",
        {
            model: "phi3:mini",
            prompt: guidePrompt,
            stream: false
        }
    );

    return res.json({
        success: true,
        reply: aiResponse.data.response
    });
}


        //tour package search
    if (
    lowerMessage.includes("package") ||
    lowerMessage.includes("tour")
) {

    const destination = await extractCity(message);

console.log("Package City:", destination);

    const tourPackage = await TourPackage.findOne({
        destination: {
            $regex: destination,
            $options: "i"
        }
    });

    if (!tourPackage) {
        return res.json({
            success: false,
            reply: "No tour package found"
        });
    }

    const packagePrompt = `
You are a tourism assistant.

Rules:
- Give only ONE recommendation.
- Maximum 100 words.
- Do not repeat information.
- Use one paragraph only.

Package Name:
${tourPackage.name}

Destination:
${tourPackage.destination}

Duration:
${tourPackage.duration} days

Description:
${tourPackage.description}

Base Price:
LKR ${tourPackage.basePrice}

Recommend this package.
`;

    const aiResponse = await axios.post(
        "http://localhost:11434/api/generate",
        {
            model: "phi3:mini",
            prompt: packagePrompt,
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