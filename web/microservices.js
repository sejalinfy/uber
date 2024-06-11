import express from 'express';
import shopify from './shopify.js';

const app = express();

//Get Orders - Infy
app.get('/api/orders/:orderId', async (req, res) => {
  const { orderId } = req.params;
  console.log('In get request');
  console.log(`/api/orders/${orderId}`);

  try {
    // Session is built by the OAuth process
    const response = await shopify.api.rest.Order.find({
      session: res.locals.shopify.session,
      id: orderId,
    });
    console.log('ORDER: ', response);
    res.status(200).send(response);
  } catch (err) {
    res.status(500).send(err);
  }
});