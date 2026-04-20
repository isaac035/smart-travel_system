const normalize = (value) => String(value || '').trim().toLowerCase();

const normalizeList = (value) => {
  if (Array.isArray(value)) return value.map(normalize).filter(Boolean);
  return normalize(value) ? [normalize(value)] : [];
};

const getMatchLabel = (score) => {
  if (score >= 85) return 'Best Match';
  if (score >= 70) return 'Good Match';
  if (score >= 50) return 'Moderate Match';
  return 'Low Match';
};

const isNearBudget = (budget, minBudget, maxBudget) => {
  if (!budget || (!minBudget && !maxBudget)) return false;
  const lower = Number(minBudget || 0);
  const upper = Number(maxBudget || 0);
  const rangeSize = Math.max(upper - lower, upper * 0.15, 5000);
  return budget >= lower - rangeSize * 0.25 && budget <= upper + rangeSize * 0.25;
};

const calculateBundleSuitability = (bundle, preferences = {}) => {
  let score = 0;
  const reasons = [];

  const travelerType = normalize(preferences.travelerType);
  const targetTravelerType = normalize(bundle.targetTravelerType);
  if (travelerType && targetTravelerType === travelerType) {
    score += 20;
    reasons.push('Suitable for your traveler type');
  } else if (travelerType && targetTravelerType === 'any') {
    score += 10;
    reasons.push('Works for any traveler type');
  }

  const destination = normalize(preferences.destination);
  const destinations = [
    ...normalizeList(bundle.recommendedDestination),
    ...normalizeList(bundle.location),
  ];
  if (destination && destinations.includes(destination)) {
    score += 20;
    reasons.push('Matches your selected destination');
  }

  const budget = Number(preferences.budget || 0);
  const minBudget = Number(bundle.minBudget || 0);
  const maxBudget = Number(bundle.maxBudget || 0);
  if (budget && minBudget && maxBudget && budget >= minBudget && budget <= maxBudget) {
    score += 20;
    reasons.push('Fits your selected budget');
  } else if (isNearBudget(budget, minBudget, maxBudget)) {
    score += 10;
    reasons.push('Close to your selected budget range');
  }

  if (normalize(preferences.tripCategory) && normalize(bundle.tripCategory) === normalize(preferences.tripCategory)) {
    score += 15;
    reasons.push('Matches your trip category');
  }

  const weatherPreference = normalize(preferences.weatherPreference);
  const recommendedWeather = normalize(bundle.recommendedWeather);
  if (weatherPreference && recommendedWeather === weatherPreference) {
    score += 10;
    reasons.push('Works well for your weather preference');
  } else if (weatherPreference && recommendedWeather === 'any') {
    score += 5;
    reasons.push('Suitable for different weather conditions');
  }

  const tripDuration = normalize(preferences.tripDuration);
  const recommendedDuration = normalize(bundle.recommendedDuration);
  if (tripDuration && recommendedDuration === tripDuration) {
    score += 5;
    reasons.push('Matches your trip duration');
  } else if (tripDuration && recommendedDuration === 'any') {
    score += 2;
    reasons.push('Flexible for different trip lengths');
  }

  if (normalize(preferences.activityLevel) && normalize(bundle.activityLevel) === normalize(preferences.activityLevel)) {
    score += 5;
    reasons.push('Matches your preferred activity level');
  }

  const ageGroup = normalize(preferences.ageGroup);
  const ageSuitability = normalize(bundle.ageSuitability);
  if (ageGroup && ageSuitability === ageGroup) {
    score += 5;
    reasons.push('Suitable for your age group');
  } else if (ageGroup && ageSuitability === 'all') {
    score += 3;
    reasons.push('Suitable for all age groups');
  }

  return {
    suitabilityScore: Math.min(score, 100),
    suitabilityReasons: reasons,
    matchLabel: getMatchLabel(Math.min(score, 100)),
  };
};

module.exports = {
  calculateBundleSuitability,
  getMatchLabel,
};
