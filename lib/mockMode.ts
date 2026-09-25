// Mock mode runs the whole app on localStorage — no Firebase project required.
// Enabled explicitly via PUBLIC_MOCK=1, or automatically when no API key is set.
export const IS_MOCK =
  process.env.PUBLIC_MOCK === "1" ||
  !process.env.PUBLIC_FIREBASE_API_KEY ||
  process.env.PUBLIC_FIREBASE_API_KEY === "your_api_key";
