
import { GoogleGenAI, Type } from "@google/genai";
import { UserPreferences, TripOption } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateWeekendTrips(prefs: UserPreferences): Promise<TripOption[]> {
  const prompt = `
    Act as a brutally honest local weekend travel expert for India. 
    Current City: ${prefs.city} ${prefs.coords ? `(Located at approx ${prefs.coords.latitude}, ${prefs.coords.longitude})` : ''}
    Target Budget: ${prefs.budget}
    Trip Vibe: ${prefs.vibe}
    Travelers: ${prefs.tripType}
    Preferred Mode: ${prefs.travelMode}

    Generate 3 realistic, high-quality weekend trip options (no flights). 
    
    STRUCTURED ITINERARY REQUIRED:
    For each day, provide a structured schedule with 'Morning', 'Afternoon', and 'Evening' blocks. Each block should have an 'activity' and a brief 'note'.

    COST BREAKDOWN REQUIRED:
    Estimate the split for: Stay, Travel, Food, and Misc within the budget ${prefs.budget}.

    CRITICAL: Use the Google Search tool to find 3-5 AUTHENTIC, REAL-WORLD photos for each destination. 
    Return the image URLs and their source website URLs.

    REQUIRED ANTI-INFLUENCER FEATURES:
    - "notForEveryone": Brutally honest warning.
    - "weatherSensitivity": Impact of weather on plans.
    - "userStories": 2 short, anonymous text-only "raw" experiences.
    - "nudgeReason": Specific reason for THIS weekend.

    Focus on authenticity and honesty. Use casual, Gen-Z friendly language.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            destination: { type: Type.STRING },
            destinationMapsUrl: { type: Type.STRING },
            whyFits: { type: Type.STRING },
            distance: { type: Type.NUMBER },
            travelTime: { type: Type.STRING },
            budgetRange: { type: Type.STRING },
            costBreakdown: {
              type: Type.OBJECT,
              properties: {
                stay: { type: Type.STRING },
                travel: { type: Type.STRING },
                food: { type: Type.STRING },
                misc: { type: Type.STRING }
              },
              required: ["stay", "travel", "food", "misc"]
            },
            crowdLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
            weather: { type: Type.STRING, enum: ['sunny', 'cloudy', 'rainy', 'cool'] },
            weatherSensitivity: { type: Type.STRING },
            bestTime: { type: Type.STRING },
            staySuggestion: { type: Type.STRING },
            experiences: { type: Type.ARRAY, items: { type: Type.STRING } },
            foodHighlight: { type: Type.STRING },
            realityScore: { type: Type.NUMBER },
            tag: { type: Type.STRING, enum: ['Overrated', 'Underrated'] },
            notForEveryone: { type: Type.STRING },
            costStats: { type: Type.STRING },
            nudgeReason: { type: Type.STRING },
            images: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  url: { type: Type.STRING },
                  sourceUrl: { type: Type.STRING }
                },
                required: ["url", "sourceUrl"]
              }
            },
            itinerary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.NUMBER },
                  title: { type: Type.STRING },
                  items: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING, enum: ['Morning', 'Afternoon', 'Evening'] },
                        activity: { type: Type.STRING },
                        note: { type: Type.STRING }
                      },
                      required: ["time", "activity"]
                    }
                  }
                },
                required: ["day", "title", "items"]
              }
            },
            hotels: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  type: { type: Type.STRING },
                  approxPrice: { type: Type.STRING },
                  mapsUrl: { type: Type.STRING }
                },
                required: ["name", "type", "approxPrice", "mapsUrl"]
              }
            },
            userStories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  username: { type: Type.STRING },
                  date: { type: Type.STRING }
                },
                required: ["text", "username", "date"]
              }
            }
          },
          required: [
            "id", "destination", "destinationMapsUrl", "whyFits", "distance", 
            "travelTime", "budgetRange", "costBreakdown", "crowdLevel", "weather", 
            "weatherSensitivity", "bestTime", "staySuggestion", "experiences", 
            "foodHighlight", "realityScore", "costStats", "nudgeReason", 
            "itinerary", "hotels", "userStories", "notForEveryone", "images"
          ]
        }
      }
    }
  });

  try {
    const result = JSON.parse(response.text || '[]');
    return result.map((t: any) => ({
      ...t,
      timestamp: Date.now(),
      tripType: prefs.tripType,
      status: 'discovered',
      votes: 0
    }));
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    return [];
  }
}
