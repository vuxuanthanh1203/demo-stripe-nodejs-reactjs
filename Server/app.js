const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(
  //Secret key
  "sk_test_51OUQbxIjEdHDf9AjcRle8RNpuQkf26KBP2frG189ssvgaPDGF5DJspmCG90Yww0dC0LBmlRIN3lxQcYUxveSnPPF00cS0N6WXM"
);

app.use(express.json());
app.use(cors());

app.post("/api/create-checkout-session", async (req, res) => {
  const { products } = req.body;

  /**
   * Reference:
   * https://stripe.com/docs/payments/checkout/how-checkout-works
   * https://stripe.com/docs/api/checkout/sessions/create#create_checkout_session-line_items
   */
  const lineItems = products.map((product) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: product.dish,
        images: [product.imgdata],
      },
      unit_amount: product.price * 100,
    },
    quantity: product.qnty,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: "http://localhost:3000/success",
    cancel_url: "http://localhost:3000/cancel",
  });

  res.json({ id: session.id });
});

app.listen(5000, () => {
  console.log("Server start");
});
