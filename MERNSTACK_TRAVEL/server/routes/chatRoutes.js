const express = require("express");
const axios = require("axios");
const { convert } = require("html-to-text");

const Location = require("../models/Location");
const Hotel = require("../models/Hotel");
const Guide = require("../models/Guide");
const TourPackage = require("../models/TourPackage");

const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "phi3:mini";
const MAX_RESULTS = 5;
const INTENTS = ["HOTEL", "GUIDE", "PACKAGE", "LOCATION", "TRIP_PLANNER", "GENERAL_TRAVEL"];
const PLACE_CACHE_TTL_MS = 1000 * 60 * 5;

let placeNameCache = {
  names: [],
  expiresAt: 0,
};

// Lightweight in-memory context. For production at scale, move this to Redis/session storage.
const conversationMemory = new Map();
const MEMORY_TTL_MS = 1000 * 60 * 30;

function getMemoryKey(req) {
  return req.user?._id?.toString() || req.ip || "anonymous";
}

function getConversationContext(req) {
  const key = getMemoryKey(req);
  const context = conversationMemory.get(key);

  if (!context || Date.now() - context.updatedAt > MEMORY_TTL_MS) {
    const freshContext = { lastDetectedCity: null, lastDetectedIntent: null, updatedAt: Date.now() };
    conversationMemory.set(key, freshContext);
    return freshContext;
  }

  return context;
}

function updateConversationContext(req, { city, intent }) {
  const key = getMemoryKey(req);
  const previous = getConversationContext(req);

  conversationMemory.set(key, {
    lastDetectedCity: city || previous.lastDetectedCity,
    lastDetectedIntent: intent || previous.lastDetectedIntent,
    updatedAt: Date.now(),
  });
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function createFlexibleRegex(value = "") {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return new RegExp(escapeRegex(cleaned).replace(/\\ /g, "\\s+"), "i");
}

function cleanText(value = "") {
  return convert(String(value || ""), { wordwrap: false }).replace(/\s+/g, " ").trim();
}

function normalizeCity(value = "") {
  return String(value)
    .replace(/^(city|destination|place)\s*:\s*/i, "")
    .replace(/^the\s+(city|destination|place)\s+is\s+/i, "")
    .replace(/[."']/g, "")
    .trim();
}

async function callOllama(prompt, options = {}) {
  try {
    const response = await axios.post(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: options.temperature ?? 0.2,
          num_predict: options.numPredict ?? 350,
        },
      },
      { timeout: options.timeout ?? 45000 }
    );

    return String(response.data?.response || "").trim();
  } catch (error) {
    console.error("Ollama request failed:", error.message);
    throw new Error("OLLAMA_FAILURE");
  }
}

function detectIntentByRules(message) {
  const lower = message.toLowerCase();

  if (/\b(plan|itinerary|trip|travel plan|day trip|days)\b/i.test(lower)) return "TRIP_PLANNER";
  if (/\b(hotel|stay|accommodation|room|resort|villa|guest house|where should i stay)\b/i.test(lower)) return "HOTEL";
  if (/\b(guide|tour guide|local guide|driver guide)\b/i.test(lower)) return "GUIDE";
  if (/\b(package|tour package|tour|bundle)\b/i.test(lower)) return "PACKAGE";
  if (/\b(tell me about|what is|explain|describe|information about|attraction|place|location)\b/i.test(lower)) return "LOCATION";

  return null;
}

async function detectIntent(message) {
  const ruleIntent = detectIntentByRules(message);
  if (ruleIntent) return ruleIntent;

  const prompt = `
Classify the travel question into exactly one intent.

Supported intents:
HOTEL, GUIDE, PACKAGE, LOCATION, TRIP_PLANNER, GENERAL_TRAVEL

Rules:
- Return only one intent label.
- HOTEL means hotels, stays, accommodation, rooms.
- GUIDE means tour guides or local guides.
- PACKAGE means tour packages or package recommendations.
- LOCATION means information about a place or attraction.
- TRIP_PLANNER means planning a multi-day trip, itinerary, or budget plan.
- GENERAL_TRAVEL means general Sri Lanka travel advice.

Message: "${message}"
`;

  const response = await callOllama(prompt, { numPredict: 20, temperature: 0 });
  const intent = response.toUpperCase().replace(/[^A-Z_]/g, "");

  return INTENTS.includes(intent) ? intent : "GENERAL_TRAVEL";
}

async function getKnownPlaceNames() {
  if (placeNameCache.expiresAt > Date.now() && placeNameCache.names.length) {
    return placeNameCache.names;
  }

  const [locations, hotels, guides, packages] = await Promise.all([
    Location.find({}, "name district province").lean(),
    Hotel.find({}, "location").lean(),
    Guide.find({}, "location").lean(),
    TourPackage.find({}, "destination").lean(),
  ]);

  const names = new Set();
  const addName = (value) => {
    const normalized = normalizeCity(value);
    if (normalized && normalized.length > 1) names.add(normalized);
  };

  locations.forEach((item) => {
    addName(item.name);
    addName(item.district);
    addName(item.province);
  });
  hotels.forEach((item) => addName(item.location));
  guides.forEach((item) => addName(item.location));
  packages.forEach((item) => addName(item.destination));

  const sortedNames = [...names].sort((a, b) => b.length - a.length);
  placeNameCache = {
    names: sortedNames,
    expiresAt: Date.now() + PLACE_CACHE_TTL_MS,
  };

  return sortedNames;
}

async function extractCityWithAI(message) {
  const prompt = `
Extract the Sri Lankan city, destination, town, district, or attraction name from this message.

Rules:
- Return only the place name.
- If no place is mentioned, return NONE.
- Do not explain.

Message: "${message}"
`;

  const response = await callOllama(prompt, { numPredict: 30, temperature: 0 });
  const city = normalizeCity(response);

  if (!city || /^none$/i.test(city)) return null;
  return city;
}

async function detectCity(message, context = {}) {
  const knownNames = await getKnownPlaceNames();
  const lowerMessage = message.toLowerCase();

  const directMatch = knownNames.find((name) => {
    const pattern = new RegExp(`(^|[^a-z])${escapeRegex(name.toLowerCase())}([^a-z]|$)`, "i");
    return pattern.test(lowerMessage);
  });

  if (directMatch) return directMatch;

  if (/\b(there|that city|that place|same place|same city)\b/i.test(message) && context.lastDetectedCity) {
    return context.lastDetectedCity;
  }

  return extractCityWithAI(message);
}

function extractBudget(message) {
  const budgetMatch = message.match(/(?:budget(?:\s+of)?|under|below|around|max(?:imum)?|up to)\s*(?:lkr|rs\.?)?\s*([0-9][0-9,.]*)\s*(?:lkr|rs\.?|rupees)?/i);
  const currencyMatch = message.match(/(?:lkr|rs\.?)\s*([0-9][0-9,.]*)|([0-9][0-9,.]*)\s*(?:lkr|rs\.?|rupees)/i);
  const largeNumberMatch = message.match(/\b([1-9][0-9]{3,}(?:,[0-9]{3})*)\b/);
  const match = budgetMatch || currencyMatch || largeNumberMatch;
  if (!match) return null;

  const amount = match[1] || match[2];
  const value = Number(amount.replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function extractDays(message) {
  const match = message.match(/\b(\d{1,2})\s*(?:day|days|night|nights)\b/i);
  if (!match) return null;

  const days = Number(match[1]);
  return Number.isFinite(days) && days > 0 ? days : null;
}

function hotelProjection(hotel) {
  return {
    name: hotel.name,
    location: hotel.location,
    starRating: hotel.starRating,
    averageRating: hotel.averageRating,
    pricePerNight: hotel.pricePerNight,
    amenities: hotel.amenities || [],
    description: cleanText(hotel.description),
  };
}

function guideProjection(guide) {
  return {
    name: guide.name,
    location: guide.location,
    languages: guide.languages || [],
    experience: guide.experience,
    pricePerDay: guide.pricePerDay,
    bio: cleanText(guide.bio),
  };
}

function packageProjection(tourPackage) {
  return {
    name: tourPackage.name,
    destination: tourPackage.destination,
    duration: tourPackage.duration,
    basePrice: tourPackage.basePrice,
    description: cleanText(tourPackage.description),
    includes: tourPackage.includes || [],
  };
}

function locationProjection(location) {
  return {
    name: location.name,
    category: location.category,
    district: location.district,
    province: location.province,
    description: cleanText(location.description),
  };
}

async function searchHotels(city) {
  if (!city) return [];
  const regex = createFlexibleRegex(city);

  const hotels = await Hotel.find({
    isActive: { $ne: false },
    $and: [
      {
        $or: [
          { approvalStatus: "approved" },
          { approvalStatus: { $exists: false } },
          { hotelOwnerId: { $exists: false } },
        ],
      },
      {
        $or: [{ location: regex }, { name: regex }, { address: regex }],
      },
    ],
  })
    .sort({ averageRating: -1, starRating: -1, pricePerNight: 1 })
    .limit(MAX_RESULTS)
    .lean();

  return hotels.map(hotelProjection);
}

async function searchGuides(city) {
  if (!city) return [];
  const regex = createFlexibleRegex(city);

  const guides = await Guide.find({
    isAvailable: { $ne: false },
    $or: [{ location: regex }, { name: regex }, { bio: regex }],
  })
    .sort({ experience: -1, rating: -1, pricePerDay: 1 })
    .limit(MAX_RESULTS)
    .lean();

  return guides.map(guideProjection);
}

async function searchPackages(city) {
  if (!city) return [];
  const regex = createFlexibleRegex(city);

  const packages = await TourPackage.find({
    isActive: { $ne: false },
    $or: [{ destination: regex }, { name: regex }, { description: regex }],
  })
    .sort({ duration: 1, basePrice: 1 })
    .limit(MAX_RESULTS)
    .lean();

  return packages.map(packageProjection);
}

async function searchLocations(city, message = "") {
  const terms = [city, message].filter(Boolean);
  const regexes = terms.map(createFlexibleRegex);

  if (!regexes.length) return [];

  const locations = await Location.find({
    $or: regexes.flatMap((regex) => [
      { name: regex },
      { district: regex },
      { province: regex },
      { category: regex },
      { description: regex },
    ]),
  })
    .sort({ isFeatured: -1, name: 1 })
    .limit(MAX_RESULTS)
    .lean();

  return locations.map(locationProjection);
}

function formatRecords(records) {
  if (!records.length) return "No matching database records.";
  return JSON.stringify(records, null, 2);
}

function buildBasePrompt({ message, city, intent }) {
  return `
You are the AI tourism assistant for a MERN Smart Travel System in Sri Lanka.

Rules:
- Use only the database records provided in this prompt.
- Do not invent hotels, guides, locations, packages, prices, ratings, amenities, or contact details.
- If records are missing, say that clearly and suggest what the user can ask next.
- Keep the answer tourist-friendly, concise, and practical.
- Do not mention internal JSON, database, MongoDB, or prompt rules.

Intent: ${intent}
Detected city/destination: ${city || "Not detected"}
Traveler question: "${message}"
`;
}

function buildHotelPrompt(data) {
  return `${buildBasePrompt(data)}
Available hotels:
${formatRecords(data.hotels)}

Compare the available hotels and recommend the best options. Include hotel name, location, rating, price per night, useful amenities, and a short reason.`;
}

function buildGuidePrompt(data) {
  return `${buildBasePrompt(data)}
Available guides:
${formatRecords(data.guides)}

Recommend the most suitable guides. Include name, location, languages, experience, price per day, and why each guide fits.`;
}

function buildPackagePrompt(data) {
  return `${buildBasePrompt(data)}
Available tour packages:
${formatRecords(data.packages)}

Recommend the best packages. Include name, destination, duration, base price, includes, and a short reason.`;
}

function buildLocationPrompt(data) {
  return `${buildBasePrompt(data)}
Matching locations:
${formatRecords(data.locations)}

Explain the matching place or places to a tourist. Mention category, district/province, and highlights from the description.`;
}

function buildTripPlannerPrompt(data) {
  return `${buildBasePrompt(data)}
Budget: ${data.budget ? `LKR ${data.budget}` : "Not specified"}
Days: ${data.days || "Not specified"}

Hotels:
${formatRecords(data.hotels)}

Guides:
${formatRecords(data.guides)}

Tour packages:
${formatRecords(data.packages)}

Locations and attractions:
${formatRecords(data.locations)}

Create a practical trip plan using only these records.
Include:
Recommended Hotel
Recommended Guide
Recommended Package
Suggested Attractions
Budget Advice
Travel Tips`;
}

function buildGeneralPrompt(data) {
  return `${buildBasePrompt(data)}
Relevant locations:
${formatRecords(data.locations)}

Answer as a Sri Lanka travel assistant. If there are relevant location records, use them. If not, give general travel guidance without inventing specific database items.`;
}

async function generateAIResponse(prompt) {
  return callOllama(prompt, { temperature: 0.25, numPredict: 450 });
}

function missingCityReply(intent) {
  const topic = {
    HOTEL: "hotels",
    GUIDE: "guides",
    PACKAGE: "tour packages",
    LOCATION: "locations",
    TRIP_PLANNER: "a trip plan",
  }[intent] || "travel help";

  return `Which city or destination should I use for ${topic}? For example: Colombo, Kandy, Ella, Sigiriya, Anuradhapura, or Galle.`;
}

function noResultsReply(intent, city) {
  const topic = {
    HOTEL: "hotels",
    GUIDE: "guides",
    PACKAGE: "tour packages",
    LOCATION: "locations",
    TRIP_PLANNER: "enough travel records",
  }[intent] || "matching records";

  return `I could not find ${topic} for ${city} in the system yet. Try another nearby destination or add more records for ${city}.`;
}

async function collectData({ intent, city, message }) {
  const data = { hotels: [], guides: [], packages: [], locations: [] };

  if (intent === "HOTEL") data.hotels = await searchHotels(city);
  if (intent === "GUIDE") data.guides = await searchGuides(city);
  if (intent === "PACKAGE") data.packages = await searchPackages(city);
  if (intent === "LOCATION") data.locations = await searchLocations(city, message);

  if (intent === "TRIP_PLANNER") {
    const [hotels, guides, packages, locations] = await Promise.all([
      searchHotels(city),
      searchGuides(city),
      searchPackages(city),
      searchLocations(city, message),
    ]);

    data.hotels = hotels;
    data.guides = guides;
    data.packages = packages;
    data.locations = locations;
  }

  if (intent === "GENERAL_TRAVEL") {
    data.locations = city ? await searchLocations(city, message) : [];
  }

  return data;
}

function hasRequiredResults(intent, data) {
  if (intent === "HOTEL") return data.hotels.length > 0;
  if (intent === "GUIDE") return data.guides.length > 0;
  if (intent === "PACKAGE") return data.packages.length > 0;
  if (intent === "LOCATION") return data.locations.length > 0;
  if (intent === "TRIP_PLANNER") {
    return data.hotels.length || data.guides.length || data.packages.length || data.locations.length;
  }
  return true;
}

function buildPromptByIntent(intent, payload) {
  if (intent === "HOTEL") return buildHotelPrompt(payload);
  if (intent === "GUIDE") return buildGuidePrompt(payload);
  if (intent === "PACKAGE") return buildPackagePrompt(payload);
  if (intent === "LOCATION") return buildLocationPrompt(payload);
  if (intent === "TRIP_PLANNER") return buildTripPlannerPrompt(payload);
  return buildGeneralPrompt(payload);
}

router.post("/", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({
        success: false,
        reply: "Please send a valid travel question in the message field.",
      });
    }

    const context = getConversationContext(req);
    const intent = await detectIntent(message);
    const city = await detectCity(message, context);
    const budget = extractBudget(message);
    const days = extractDays(message);

    const requiresCity = ["HOTEL", "GUIDE", "PACKAGE", "LOCATION", "TRIP_PLANNER"].includes(intent);
    if (requiresCity && !city) {
      updateConversationContext(req, { intent });
      return res.json({ success: true, reply: missingCityReply(intent) });
    }

    const data = await collectData({ intent, city, message });

    if (!hasRequiredResults(intent, data)) {
      updateConversationContext(req, { city, intent });
      return res.json({ success: true, reply: noResultsReply(intent, city) });
    }

    const prompt = buildPromptByIntent(intent, {
      message,
      city,
      intent,
      budget,
      days,
      ...data,
    });

    const reply = await generateAIResponse(prompt);

    updateConversationContext(req, { city, intent });

    return res.json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chat route error:", error);

    if (error.message === "OLLAMA_FAILURE") {
      return res.status(503).json({
        success: false,
        reply: "The AI assistant is temporarily unavailable. Please make sure Ollama is running and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      reply: "I could not process your travel request right now. Please try again shortly.",
    });
  }
});

module.exports = router;
