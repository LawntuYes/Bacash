// Import the Textract client
// (Like S3, Textract is built-in for Node 18+ Lambda runtimes!)
const {
  TextractClient,
  AnalyzeExpenseCommand,
} = require("@aws-sdk/client-textract");

// Initialize Textract client
const textractClient = new TextractClient({
  region: process.env.AWS_REGION || "us-east-1",
});

exports.handler = async (event) => {
  console.log("Received S3 Event:", JSON.stringify(event, null, 2));

  try {
    // Triggered by S3, the event structure is an array of Records
    // This gets the very first file that was uploaded (which triggered the Lambda)
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    // The object key (filename) is often URL encoded by S3, so we decode it
    const objectKey = decodeURIComponent(
      record.s3.object.key.replace(/\+/g, " "),
    );

    console.log(`Processing receipt from S3: s3://${bucketName}/${objectKey}`);

    // Set up the Amazon Textract command specifically for receipts/invoices
    const analyzeExpenseCmd = new AnalyzeExpenseCommand({
      Document: {
        S3Object: {
          Bucket: bucketName,
          Name: objectKey,
        },
      },
    });

    // Call Textract directly on the S3 Object
    console.log("Calling Textract AnalyzeExpense...");
    const response = await textractClient.send(analyzeExpenseCmd);

    // --- DATA EXTRACTION ---
    // Textract returns a deeply nested JSON containing everything it found.
    // For standard receipts, the most important info is found in `ExpenseDocuments[0].SummaryFields`
    const extractedData = {};

    if (response.ExpenseDocuments && response.ExpenseDocuments.length > 0) {
      const summaryFields = response.ExpenseDocuments[0].SummaryFields;

      // Loop through all fields Textract found and extract the label and value
      summaryFields.forEach((field) => {
        if (field.Type && field.ValueDetection) {
          // Type will be things like 'VENDOR_NAME', 'TOTAL', 'INVOICE_RECEIPT_DATE'
          extractedData[field.Type.Text] = field.ValueDetection.Text;
        }
      });
    }

    console.log(
      "Extraction Complete. Found Data:",
      JSON.stringify(extractedData, null, 2),
    );

    // TODO: This is where you would normally save `extractedData` to a DynamoDB database!

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Receipt processed successfully by Textract",
        data: extractedData,
      }),
    };
  } catch (error) {
    console.error("Error processing receipt with Textract:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to process receipt" }),
    };
  }
};
