# BaCash - AWS Deployment Guide

This guide provides step-by-step instructions for deploying the BaCash frontend application using Amazon S3 and CloudFront.

## Prerequisites
- AWS Account
- AWS CLI configured (optional, for cache invalidation)

## Step 1: Create an S3 Bucket
1. Go to the **S3 Console** in AWS.
2. Click **Create bucket**.
3. Name the bucket `bacash-frontend` (or your preferred unique name).
4. Uncheck **Block all public access** (acknowledge the warning).
5. Click **Create bucket**.

## Step 2: Enable Static Website Hosting
1. Open your newly created bucket.
2. Go to the **Properties** tab.
3. Scroll down to **Static website hosting** and click **Edit**.
4. Select **Enable**.
5. Set the **Index document** to `index.html`.
6. Click **Save changes**.

## Step 3: Set Bucket Policy
1. Go to the **Permissions** tab of your bucket.
2. Scroll down to **Bucket policy** and click **Edit**.
3. Add the following policy (replace `YOUR_BUCKET_NAME` with your actual bucket name):
   ```json
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Sid": "PublicReadGetObject",
               "Effect": "Allow",
               "Principal": "*",
               "Action": "s3:GetObject",
               "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
           }
       ]
   }
   ```
4. Click **Save changes**.

## Step 4: Upload Files to S3
1. Go to the **Objects** tab.
2. Click **Upload**.
3. Upload both `index.html` and `config.json`.
4. Click **Upload**.

## Step 5: Configure CloudFront Distribution
1. Go to the **CloudFront Console**.
2. Click **Create Distribution**.
3. In the **Origin domain**, select your S3 bucket's website endpoint (not the regular S3 endpoint).
   *Example: `bacash-frontend.s3-website-us-east-1.amazonaws.com`*
4. Under **Viewer Protocol Policy**, select **Redirect HTTP to HTTPS**.
5. Under **Default root object**, type `index.html`.
6. Click **Create Distribution**.

## Step 6: Update `config.json`
Once you have your AWS resources created, update `config.json` with the real values:
- `"bucketName"`: Your S3 bucket name.
- `"publicUrl"`: The S3 static website URL.
- `"distributionId"`: Your CloudFront Distribution ID.
- `"cdnUrl"`: Your CloudFront distribution domain name (e.g., `https://dxxxxxxxxxx.cloudfront.net`).
- `"googleClientId"`: Your real Google OAuth Client ID for sign-in.

## Step 7: Clear CloudFront Cache (Invalidation)
Whenever you make updates to `index.html` or `config.json` and upload them to S3, you need to clear the CloudFront cache to see the changes globally.
Run this command in your terminal:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```
