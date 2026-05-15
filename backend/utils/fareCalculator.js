// Fare calculation logic
const BASE_FARE = 2.00;
const COST_PER_KM = 0.80;
const COST_PER_MINUTE = 0.20;

const calculateFare = (distanceInKm, durationInMinutes, surgeMultiplier = 1.0) => {
  const distanceCost = distanceInKm * COST_PER_KM;
  const timeCost = durationInMinutes * COST_PER_MINUTE;
  
  const totalFare = (BASE_FARE + distanceCost + timeCost) * surgeMultiplier;
  
  return parseFloat(totalFare.toFixed(2));
};

module.exports = { calculateFare };
