export default {
  async fetch(request, env) {
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
      // Ambil semua data dari front-end, termasuk history dan gambar
      const { history, prompt, imageData } = await request.json();
      
      const parts = [{ text: prompt }];

      // Kalau ada gambar, tambahkan ke parts
      if (imageData) {
        parts.unshift({
          inlineData: {
            mimeType: imageData.mimeType,
            data: imageData.data,
          }
        });
      }

      const contents = history ? [...history, { role: "user", parts }] : [{ role: "user", parts }];
      
      const payload = {
        contents: contents,
      };

      const GEMINI_API_KEY = env.GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${GEMINI_API_KEY}`,
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
};};
