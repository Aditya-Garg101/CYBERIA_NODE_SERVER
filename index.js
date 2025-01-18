const dotenv = require('dotenv');
const express = require("express");
const { default: mongoose } = require("mongoose");
const eventRoute = require("./router/Event");
// const paymentRoute = require("./router/Payment");
const userRoute = require("./router/User");
const cors = require("cors");
const { WebSocketServer } = require('ws');
const { initializeWebSocket } = require('./controller/User');
const bodyParser = require('body-parser');
const twilio = require('twilio');

dotenv.config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 8001; // Use environment variable for port, fallback to 8001

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

app.post('/send-message', async (req, res) => {
  const { to } = req.body; // WhatsApp number in format 'whatsapp:+1234567890'

  const messageBody = `
🎉 Congratulations! Your registration for Cyberia Tech Fest 2025 is confirmed! 🎉

📌 Here are your ticket details:
Event: Cyberia Tech Fest 2025
Dates: 27th, 28th February & 1st March
Venue: Maharaja Sayajirao University of Baroda

✅ Keep this ticket safe and present it at the event for entry.
If you have any questions or need further assistance, feel free to message here.

🚀 Get ready for an amazing tech experience—see you at Cyberia Tech Fest 2025! 🙌
`;

  try {
    const message = await client.messages.create({
      from: `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`, // Ensure this has 'whatsapp:'
      to: `whatsapp:${to}`, // Remove the space after 'whatsapp:'
      body: messageBody,
    });
    res.status(200).send({ success: true, message });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send({ success: false, error });
  }
});


app.server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  initializeWebSocket(app.server); // Pass the server instance to the WebSocket controller

});


// CORS setup
const allowedOrigins = [
  "https://cyberia2k24.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://www.msudcacyberia.in",
  "https://msudcacyberia.in",
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  })
);


// Routes
app.get("/", (req, res) => {
  res.send("Hello, welcome to the server!");
});

app.use("/api/events", eventRoute);
// app.use("/api/payment", paymentRoute);
app.use("/api/user", userRoute);

// Database connection
const database = process.env.DATABASE_URL;
mongoose
  .connect(database)
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

