// Utility function for reading and validating API responses, ensuring JSON content and proper error handling

export async function readApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    await response.body?.cancel();
    throw new Error(
      "The local API did not return JSON. Start the site with `npm run dev` so Netlify Functions are available.",
    );
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The API returned an invalid JSON response.");
  }
  if (!response.ok) {
    throw new Error(payload.error || "The request could not be completed.");
  }
  return payload;
}
