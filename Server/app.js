require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const stripe = require("stripe")(process.env.SECRET_KEY);
const bodyParser = require("body-parser");

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// const { MongoClient } = require("mongodb");

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

// Endpoint để xử lý thông báo từ webhook
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      "your_stripe_endpoint_secret"
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Xử lý sự kiện thanh toán thành công
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Lưu thông tin thanh toán vào database
    // await savePaymentHistory(
    //   session.customer,
    //   session.amount_total / 100,
    //   session.payment_status
    // );

    console.log("session: ", session);

    // Xử lý các thông tin khác nếu cần
  }

  res.sendStatus(200);
});

// Hàm lưu thông tin thanh toán vào database
// async function savePaymentHistory(customerId, amount, paymentStatus) {
//   const client = new MongoClient("mongodb://localhost:27017", {
//     useUnifiedTopology: true,
//   });
//   await client.connect();

//   try {
//     const database = client.db("your_database_name");
//     const collection = database.collection("payment_history");

//     // Lưu thông tin vào database
//     await collection.insertOne({
//       customerId,
//       amount,
//       paymentStatus,
//       timestamp: new Date(),
//     });
//   } finally {
//     await client.close();
//   }
// }

app.listen(5000, () => {
  console.log("Server start");
});
