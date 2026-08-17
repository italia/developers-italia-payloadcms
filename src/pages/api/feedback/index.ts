import type { APIRoute } from "astro";
import { payloadPost } from "@lib/payloadcms";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    if (!data.feedback || !data.url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const result = await payloadPost<{ doc: { id: string } }>("/feedback", {
      feedback: data.feedback || "negativo",
      url: data.url,
      message: data.details || "",
      expertise: data.who || "",
      reachedFrom: data.from || "",
    });
    console.log("Feedback saved:", result);

    return new Response(JSON.stringify({ message: "OK", id: result.doc.id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Error saving feedback:", err);
    return new Response(
      JSON.stringify({ message: "Error saving feedback.", err }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
