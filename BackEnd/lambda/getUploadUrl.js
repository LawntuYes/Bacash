exports.handler = async (event) => {
  console.log(
    "Received event for getUploadUrl:",
    JSON.stringify(event, null, 2),
  );

  try {
    // Placeholder implementation for generating a pre-signed S3 URL
    // In a real AWS setup, you would use @aws-sdk/s3-request-presigner and @aws-sdk/client-s3

    // Generate a semi-unique file name
    const fileName = `receipt-${Date.now()}.jpg`;

    // This is a placeholder API URL for now, just to test the frontend flow
    const mockPresignedUrl = `https://mock-s3-bucket.s3.amazonaws.com/uploads/${fileName}?signature=mock123`;

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Essential CORS headers if calling from a web browser
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: JSON.stringify({
        uploadUrl: mockPresignedUrl,
        fileName: fileName,
        message: "Mock pre-signed URL generated successfully",
      }),
    };
  } catch (error) {
    console.error("Error generating pre-signed URL:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
};
