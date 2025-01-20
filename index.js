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


dotenv.config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 8001; // Use environment variable for port, fallback to 8001

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());



app.server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  // Pass the server instance to the WebSocket controller

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

