exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // Assume the photo is passed in the event body as a base64 string or binary
    const photoData = event.body ? event.body : null;

    if (!photoData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "No photo data provided" }),
      };
    }

    // Mocking the request to the "API we don't have yet"
    const externalApiUrl = "https://mock-external-api.com/v1/receipts";

    console.log(`Sending photo to external API: ${externalApiUrl}`);

    // Example of how you would send it using fetch (built-in for Node 18+)
    // const response = await fetch(externalApiUrl, {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //         // 'Authorization': 'Bearer YOUR_TOKEN'
    //     },
    //     body: JSON.stringify({ image: photoData })
    // });

    // if (!response.ok) throw new Error("Failed to upload to external API");

    // For now, we simulate a successful outgoing request
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "lambda working - photo 'sent' successfully",
      }),
    };
  } catch (error) {
    console.error("Error sending photo:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
