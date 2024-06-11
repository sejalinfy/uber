// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

import { insertData, createTable, readData, deleteData } from './dynamodb.js';

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();
// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });
  res.status(200).send(countData);
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

// GET a CarrierService
app.get("/api/carrier_services", async(req, res) => {
  const current_shop = res.locals.shopify.session.shop;
  let carrier_service = await shopify.api.rest.CarrierService.all({
    session: res.locals.shopify.session,
  });
  console.log(current_shop);
  res.status(200).send(carrier_service);
});

// GET a CarrierServiceStatus
app.get("/api/carrier_services_status", async(req, res) => {
  const current_shop = res.locals.shopify.session.shop;
  const response = await readData(current_shop);
  res.status(200).send(response);
});

// CREATE A NEW CarrierService
app.post("/api/carrierservice/create", async(req, res) => {
  const current_shop = res.locals.shopify.session.shop;
  const carrier_service_status = 1;
  const carrier_service = new shopify.api.rest.CarrierService({session: res.locals.shopify.session});
  carrier_service.name = "Shipping Rate Provider-Uber";
  carrier_service.callback_url = "https://node-shopify.fly.dev/ship";
  carrier_service.service_discovery = true;
  const carrier_service_data = await carrier_service.save({
    update: true,
  });
  const status = 1;

  (async () => {
    await createTable();
    await insertData(current_shop, carrier_service_status);
    await readData(current_shop);
  })();
  res.status(200).send({Message: "CarrierService created Successfully"});
});

// DELETE A CarrierService
app.delete("/api/carrierservice/delete", async (req, res) => {
  const current_shop = res.locals.shopify.session.shop;
  // DELETE a CarrierService
  try {
    // Call the getCarrierServices function and get the response
    const carrierServiceId = await getCarrierServices(req, res);

    if (!carrierServiceId) {
      return res.status(400).json({ error: "Carrier service ID is required" });
    }
    await shopify.api.rest.CarrierService.delete({
      session: res.locals.shopify.session,
      id: carrierServiceId,
    });
    (async () => {
      await deleteData(current_shop);
    })();
    res.status(200).json({ message: "Carrier service deleted successfully" });
  } catch (error) {
    console.error("Error deleting carrier service:", error);
    res.status(500).json({ error: "Failed to delete carrier service" });
  }
});

// Define the GET route handler function
const getCarrierServices = async (req, res) => {
  
  try {
    const carrierServices = await shopify.api.rest.CarrierService.all({
      session: res.locals.shopify.session,
    });

    const callbackUrl = carrierServices.data[0].callback_url;
    const carrierServiceId = carrierServices.data[0].id;

    // Return the carrierServiceId instead of sending a response
    return carrierServiceId;
  } catch (error) {
    console.error("Error getting carrier services:", error);
    res.status(500).json({ error: "Failed to get carrier services" });
  }
};

// Define the GET route
app.get("/api/carrier_services", getCarrierServices);


app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
