// Import the required AWS SDK v3 clients and commands
// (Note: In Lambda Node.js 18+ runtime, these are built-in, no need to npm install if deploying to AWS!)
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

// Initialize the S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
});

exports.handler = async (event) => {
  console.log(
    "Received event for getUploadUrl:",
    JSON.stringify(event, null, 2),
  );

  try {
    // 1. Get the bucket name from Environment Variables (Best Practice)
    // Set this variable when creating the Lambda function!
    const bucketName = process.env.UPLOAD_BUCKET_NAME || "demo-bucket-bacash";

    // 2. Generate a secure, unique file name for the S3 object key
    const fileName = `receipt-${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;

    // 3. Create the command to tell S3 what we want to do (Put an Object)
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      ContentType: "image/jpeg", // Force the content type to match
    });

    // 4. Generate the Pre-signed URL using the SDK
    // This URL gives the frontend temporary permission to execute the PutObjectCommand
    // The URL expires in 300 seconds (5 minutes)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300,
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Essential CORS headers if calling directly from a browser web app
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      },
      body: JSON.stringify({
        uploadUrl: presignedUrl,
        fileName: fileName,
        message: "Pre-signed URL generated successfully for direct S3 upload",
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
