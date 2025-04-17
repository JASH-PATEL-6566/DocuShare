// import { config } from "dotenv";

// config();

// // AWS SDK configuration
// export const awsConfig = {
//   region: process.env.AWS_REGION || "us-east-1",
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
// };

// // Initialize AWS services
// export const initAWS = () => {
//   // Configure AWS SDK with credentials
//   const credentials = {
//     accessKeyId: awsConfig.accessKeyId!,
//     secretAccessKey: awsConfig.secretAccessKey!,
//   };

//   // Set AWS config globally
//   // JS SDK v3 does not support global configuration.
//   // Codemod has attempted to pass values to each service client in this file.
//   // You may need to update clients outside of this file, if they use global config.
//   // JS SDK v3 does not support global configuration.
//   // Codemod has attempted to pass values to each service client in this file.
//   // You may need to update clients outside of this file, if they use global config.
//   // JS SDK v3 does not support global configuration.
//   // Codemod has attempted to pass values to each service client in this file.
//   // You may need to update clients outside of this file, if they use global config.
//   AWS.config.update({
//     region: awsConfig.region,
//     credentials,
//   });
// };

// // Import AWS SDK
// import * as AWS from "aws-sdk";
