import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import { DynamoDBSessionStorage } from "@shopify/shopify-app-session-storage-dynamodb";
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

//connected with booby dynomodb personal account

const storage = new DynamoDBSessionStorage({
  sessionTableName: process.env.SESSION_TABLE_NAME,
  shopIndexName: process.env.SHOP_INDEX_NAME,
  config: {
    region: process.env.REGION,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY, // Replace with your AWS access key ID
      secretAccessKey: process.env.SECRET_KEY // Replace with your AWS secret access key
    }
  }
});

// The transactions with Shopify will always be marked as test transactions, unless NODE_ENV is production.
// See the ensureBilling helper to learn more about billing in this template.
const billingConfig = {
  "My Shopify One-Time Charge": {
    // This is an example configuration that would do a one-time charge for $5 (only USD is currently supported)
    amount: 5.0,
    currencyCode: "USD",
    interval: BillingInterval.OneTime,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    billing: undefined, // or replace with billingConfig above to enable example billing
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: storage,
});

export default shopify;
