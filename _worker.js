export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // API routes
    if (url.pathname.startsWith("/api/views/")) {
      const slug = url.pathname.replace("/api/views/", "");

      if (!slug) {
        return new Response("Missing slug", { status: 400 });
      }

      const key = `views:${slug}`;

      // Handle GET request
      if (request.method === "GET") {
        const views = await env.PAGE_VIEWS.get(key);
        return new Response(
          JSON.stringify({
            views: parseInt(views || "0"),
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          },
        );
      }

      // Handle POST request
      if (request.method === "POST") {
        const currentViews = parseInt((await env.PAGE_VIEWS.get(key)) || "0");
        const newViews = currentViews + 1;
        await env.PAGE_VIEWS.put(key, newViews.toString());

        return new Response(
          JSON.stringify({
            views: newViews,
          }),
          {
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
            },
          },
        );
      }

      // Handle OPTIONS (CORS)
      if (request.method === "OPTIONS") {
        return new Response(null, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      return new Response("Method not allowed", { status: 405 });
    }

    // Serve static assets
    return env.ASSETS.fetch(request);
  },
};
