export default {
  async fetch(request, env) {
    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    try {
      const { prompt } = await request.json();
      if (!prompt) {
        return new Response("Prompt is required", { status: 400 });
      }

      const payload = {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                fieldName: { type: "STRING" },
                generatorType: { type: "STRING" },
              },
              propertyOrdering: ["fieldName", "generatorType"],
            },
          },
        },
      };

      const GEMINI_API_KEY = env.GEMINI_API_KEY;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        return new Response(`Gemini API Error: ${response.status} - ${text}`, { status: response.status });
      }

      const result = await response.json();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (err) {
      return new Response("Internal Server Error: " + err.message, { status: 500 });
    }
  },
};
