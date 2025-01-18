const express = require("express");
const QRcode = require("qrcode");
const TeamUser = require("../models/TeamUser"); // Mongoose model
const SoloUser = require("../models/SoloUser"); // Mongoose model
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
dotenv.config();
const mime = require('mime');
const admin = require("firebase-admin");
const Event = require("../models/Events");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const { WebSocketServer } = require('ws');
const app = require("..");
const serviceAccount = {
  "type": "service_account",
  "project_id": "e-commerce-backend-bfa60",
  "private_key_id": "c9a8be595a512f327417565497b1340198437c81",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCaCP7tKdGtny8B\nZLgXkNqDyiwtRoGPxQ4BkECgvY7ABdIUHeaAWvbg2fGaPJ3rDiFy/OLPW0Amxpqp\nRfZ3n450pc5yA1AbnHdwgLrAdc+czquaFOUrwZEzY85ZVWozY9RshKXAsQL+pBMr\nDsgwxdbUfPaz8debhJX6rMlzFGi5HoqC559Lq5pHSsyRe5yduKNeAQh8Yt0tLnTp\n31RaQz52g9HmdJYRKfQo53VSFGAwzF+xvR0FeZ1Hykq9HrG2PFffd2E1pNd8If+X\nd5pHxNCeGuPka06OaCoEoyP0Hm3viuTU5LPaPY9T0yw9J8kI9gUcAaUkFfYYyW9K\nh6cO8fuvAgMBAAECggEAED0uNwLneUDkxpD/kXMdfl20OOphIq7jx57AGXzHzbmv\nXfHls5bOG9gOObRLR7/GdKYcI+qFrFuCwaFqbE5qHnppIH716pCdIkNdV4ieucmA\nsNlOwcVXO/jj2moqrJPz407mtJZUxP4M4UdegTnSPguV7KmXO+zcl5VbauJLb2c9\nb9nGBSyiurQSRK2qwata385iOfLD0pjDwgZTsy6g3saqWL1YW2zFFlxBGgXSjoex\npm1uoWWQCV2lzBUGHGarpMFEsGwcpa52NVpNE10h7k3rvArOpgNiNLjyN8k6kFjs\n3z6u9OX018SIFCwhyVMbtY0MEwTgTPpBAwpJfZWr/QKBgQDRgpmuF9ZYDCxpjdxw\nfadw7FlUf5VZgd8OWJ4XOVRKmQY7aBvvgX+kOuDf9hn1avkwqSNzN/bfC4pxyMjD\nvDtU4MuWOLNRRJr+aQkYtvIqvuR7oXTwovYTVyGlfocpPIusFw2W++y7bD5mWM3q\nN2GIpW5KNxaWPS43rXh6xtBufQKBgQC8Nxc6HfRAE1T9jk+GXBNGysGSDDeCveg6\nWna73yKQfQ3+juhfZHOV7DwLhu/Xhsicadc8W1oRg0vgko+8e9fSAI7NN2tTISmM\n9irh3VDMwrTSZJLILgb+TLUakGmZ0uljxxBxkRiPqiWj+02jdNkvmT86yWRnbZcO\nMMmrBHlOmwKBgQCGc7PAP9f0hUtzKfEP1/O+yk7BpWbpHClTgZdi/A2WGgIf2b4j\nxA1wDcEGuV8LWm00xzbS2FV76mIch2ggBQpmfCTq8NRTER4OqsWFsNJUkFD87i6n\nx0z4OHCFTl/bHNndxKWaAW55EQwyjkcHSiczlEblJdk+7WBdptusny5f2QKBgQCd\nNdLz21NKNhuWkskALGZ5iiA3cnbngOK54xgsAsxnLd2DlDCqhUg6oRDie/pX5yAn\n7gw3QQKxgB7f3OusfzEdGxQse67sx9ViBbh54pd8AOJynkkwZam3vbDEGH3sW4xQ\nqFSm15BRZ8h6+Qy3jIFgzbtPyipQbexvkPbSHzGIIwKBgBKJDXofWD5AwNClPu5P\nd381vlB3cp+ir44nqzFDgdGmoA1kLsOYjKy5r1F7ESE1pCEtY3id3pzh+vp8MyKY\nKd6mjlX90f0KWOQIUlASrA/lFZBuebywpxMzG58BaUqYfT6uOJrHlj87+uT5t36m\nZGm1lRQCe1LsGz1udmN+9NU6\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-j4zn4@e-commerce-backend-bfa60.iam.gserviceaccount.com",
  "client_id": "112347859658337575349",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-j4zn4%40e-commerce-backend-bfa60.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}


// WebSocket Setup

// Create a WebSocket server
let wss;

const initializeWebSocket = (server) => {
  wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket connections
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established.');

    // Listen for incoming messages from the client
    ws.on('message', (message) => {
      console.log('Received message:', message);
    });

    // Send a welcome message to the client
    ws.send('Welcome to the WebSocket server!');
  });

  // Handle WebSocket upgrade from HTTP server
  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
};

const sendMessageToClient = (message) => {
  // Send a message to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential:
      admin.credential.cert(serviceAccount)
    ,
    storageBucket: 'gs://e-commerce-backend-bfa60.appspot.com',
  })
}

const bucket = admin.storage().bucket()
// const uploadToFirebase = async(filePath) => {
//   const bucket = admin.storage().bucket();
//   const mimeType =  mime.lookup(filePath);  
//   const uploadResponse = await bucket.upload(filePath, {  
//     destination: `pdfs/${filePath.split("/").pop()}`,
//     public: true,
//     metadata: {
//       contentType: mimeType
//       },
//     });    
//     return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadResponse[0].name)}?alt=media`;

//   };
const registerTeamUser = async (req, res) => {
  try {
    // Step 1: Generate a unique identifier
    const uniqueID = new mongoose.Types.ObjectId().toString();

    // Step 2: Generate the QR code as a PNG data URL
    const qrCodeData = await QRcode.toDataURL(uniqueID);

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.email,
        pass: process.env.password,
      },
    });

    // Step 3: Validate email input
    if (!req.body.email) {
      return res.status(400).send("Recipient's email is required");
    }

    // Convert events array to a string
    const events = req.body.events;
    const eventsString = Array.isArray(events) ? events.join(", ") : events;

    // Step 4: Create PDF in-memory (no need to save to the filesystem)
    const doc = new PDFDocument();

    // Prepare an in-memory buffer to write the PDF to
    const pdfBuffer = [];
    doc.on("data", (chunk) => pdfBuffer.push(chunk));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(pdfBuffer);

      try {
        // Step 5: Upload the PDF to Firebase Storage
        const pdfFileName = `${uniqueID}_ticket.pdf`;
        const pdfUploadPath = `tickets/${pdfFileName}`; // Customize the path if needed

        // Upload the PDF file to Firebase Storage
        const firebaseStorageRef = bucket.file(pdfUploadPath);
        await firebaseStorageRef.save(pdfData, {
          contentType: "application/pdf",
          public: true, // Make the file publicly accessible
        });

        // Get the public URL of the uploaded file
        const fileLink = `https://storage.googleapis.com/${firebaseStorageRef.bucket.name}/${firebaseStorageRef.name}`;

        // Step 6: Send the email with the Firebase URL as an attachment link
        const mailOptions = {
          from: process.env.email,
          to: req.body.email,
          subject: `Your Ticket for ${eventsString}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
              <h2 style="text-align: center; color: #0073e6;">Your Event Ticket</h2>
              <p>Dear Team ${req.body.teamName},</p>
              <p>Thank you for registering for <strong>${eventsString}</strong>!</p>
              <p>Please find your ticket attached. </p>
              <div style="background-color: #f2f2f2; padding: 10px; border-radius: 5px; text-align: center; font-size: 18px;">
                <a href="${fileLink}" target="_blank">Download Your Ticket</a>
              </div>          
              <p>We look forward to seeing you at the event!</p>
              <p>Note: QR code will be disabled once scanned, so keep it secure!</p>
              <p>Best Regards,<br>The Cyberia Team</p>
            </div>
          `,
        };

        // Send the email
        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.log(error);
            return res.status(500).json({ error: "Failed to send email" });
          } else {
            console.log(info.response);

            // Step 7: Save user details in the database with the Firebase link
            const TeamData = await TeamUser.create({
              ...req.body,
              qrString: uniqueID,
              ticket: fileLink, // Firebase link to the PDF
              events: eventsString, // Ensure events are stored as a string
            });

            res.status(201).json({
              message: "QR Code generated and sent successfully!",
              TeamData,
            });
          }
        });
      } catch (error) {
        console.error("Error uploading to Firebase:", error);
        res.status(500).json({ message: "Error uploading the ticket to Firebase" });
      }
    });

    // Generate the PDF content
    doc.fontSize(23).text("Your Event Ticket", { align: "center" });

    const pageWidth = doc.page.width; // Get the page width
    const qrCodeSize = 150; // Define the size of the QR code (150x150)
    const qrCodeX = (pageWidth - qrCodeSize) / 2; // Calculate the x position to center the image

    // Add the QR code using absolute positioning
    doc.image(qrCodeData, qrCodeX, doc.y, {
      fit: [qrCodeSize, qrCodeSize], // Fit the image within 150x150
    });

    doc.moveDown(7);

    doc.fontSize(16)
      .text(`Dear Team ${req.body.teamName},`, { align: "left" })
      .moveDown()
      .text(`We're thrilled that you'll be joining us for ${eventsString} on 24 Dec! Your tickets are attached to this email.`)
      .moveDown()
      .text("You can download the tickets from the link attached with this.")
      .moveDown()
      .text("Event Details:", { align: "left" })
      .moveDown()
      .text(`• Event Name: ${eventsString}`)
      .text(`• Venue: The Maharaja Sayajirao University of Baroda | Faculty of Science | Department of Computer Application`)
      .moveDown()
      .text("You do not need to print your ticket. A digital version will be sufficient for entry. Simply present the ticket on your phone or device when you arrive.")
      .moveDown()
      .text("We can’t wait to welcome you to the event!", { align: "left" })
      .moveDown()
      .text("Best regards,", { align: "left" })
      .moveDown()
      .text("Cyberia Team")
      .text("9408802605")
      .moveDown();

    // End the PDF generation
    doc.end();
  } catch (error) {
    console.error("Error generating QR code or email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const registerSoloUser = async (req, res) => {
  try {
    // Step 1: Generate a unique identifier
    const uniqueID = new mongoose.Types.ObjectId().toString();

    // Step 2: Generate the QR code as a PNG data URL
    const qrCodeData = await QRcode.toDataURL(uniqueID);

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.email,
        pass: process.env.password,
      },
    });

    // Step 3: Validate email input
    if (!req.body.email) {
      return res.status(400).send("Recipient's email is required");
    }

    // Convert events array to a string
    const events = req.body.events;
    const eventsString = Array.isArray(events) ? events.join(", ") : events; // Ensure it's a string

    // Step 4: Create PDF in-memory (no need to save to the filesystem)
    const doc = new PDFDocument();

    // Prepare an in-memory buffer to write the PDF to
    const pdfBuffer = [];
    doc.on("data", (chunk) => pdfBuffer.push(chunk));
    doc.on("end", async () => {
      const pdfData = Buffer.concat(pdfBuffer);

      try {
        // Step 5: Upload the PDF to Firebase Storage
        const pdfFileName = `${uniqueID}_ticket.pdf`;
        const pdfUploadPath = `tickets/${pdfFileName}`; // You can customize the path

        // Upload the PDF file to Firebase Storage
        const firebaseStorageRef = bucket.file(pdfUploadPath);
        await firebaseStorageRef.save(pdfData, {
          contentType: "application/pdf",
          public: true, // Make the file publicly accessible
        });

        // Get the public URL of the uploaded file
        const fileLink = `https://storage.googleapis.com/${firebaseStorageRef.bucket.name}/${firebaseStorageRef.name}`;
        console.log(fileLink);

        // Step 6: Send the email with the Firebase URL as an attachment link
        const mailOptions = {
          from: process.env.email,
          to: req.body.email,
          subject: `Your Ticket for ${eventsString}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
              <h2 style="text-align: center; color: #0073e6;">Your Event Ticket</h2>
              <p>Dear ${req.body.fullName},</p>
              <p>Thank you for registering for <strong>${eventsString}</strong>!</p>
              <p>Please find your ticket attached. </p>
              <div style="background-color: #f2f2f2; padding: 10px; border-radius: 5px; text-align: center; font-size: 18px;">
                <a href="${fileLink}" target="_blank">Download Your Ticket</a>
              </div>          
              <p>We look forward to seeing you at the event!</p>
              <p>Note: QR code will be disabled once scanned, so keep it secure!</p>
              <p>Best Regards,<br>The ${eventsString} Team</p>
            </div>
          `,
        };

        // Send the email
        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.log(error);
            return res.status(500).json({ error: "Failed to send email" });
          } else {
            console.log(info.response);

            // Step 7: Save user details in the database with the Firebase link
            const SoloData = await SoloUser.create({
              ...req.body,
              qrString: uniqueID,
              ticket: fileLink, // Firebase link to the PDF
              events: eventsString, // Ensure events are stored as a string
            });

            res.status(201).json({
              message: "QR Code generated and sent successfully!",
              SoloData,
            });
          }
        });
      } catch (error) {
        console.error("Error uploading to Firebase:", error);
        res.status(500).json({ message: "Error uploading the ticket to Firebase" });
      }
    });

    // Generate the PDF content
    doc.fontSize(23).text("Your Event Ticket", { align: "center" });

    const pageWidth = doc.page.width; // Get the page width
    const qrCodeSize = 150; // Define the size of the QR code (150x150)
    const qrCodeX = (pageWidth - qrCodeSize) / 2; // Calculate the x position to center the image

    // Add the QR code using absolute positioning
    doc.image(qrCodeData, qrCodeX, doc.y, {
      fit: [qrCodeSize, qrCodeSize], // Fit the image within 150x150
    });

    doc.moveDown(7);

    doc.fontSize(16)
      .text(`Dear ${req.body.fullName},`, { align: "left" })
      .moveDown()
      .text(`We're thrilled that you'll be joining us for ${eventsString} on 24 Dec! Your tickets are attached to this email.`)
      .moveDown()
      .text("You can download the tickets from the link attached with this.")
      .moveDown()
      .text("Event Details:", { align: "left" })
      .moveDown()
      .text(`• Event Name: ${eventsString}`)
      .text(`• Venue: The Maharaja Sayajirao University of Baroda | Faculty of Science | Department of Computer Application`)
      .moveDown()
      .text("You do not need to print your ticket. A digital version will be sufficient for entry. Simply present the ticket on your phone or device when you arrive.")
      .moveDown()
      .text("We can’t wait to welcome you to the event!", { align: "left" })
      .moveDown()
      .text("Best regards,", { align: "left" })
      .moveDown()
      .text("Cyberia Team")
      .text("9408802605")
      .moveDown();

    // End the PDF generation
    doc.end();
  } catch (error) {
    console.error("Error generating QR code or email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


const monitorPaymentStatus = async (linkId, interval = 5000) => {
  let isCompleted = false;

  while (!isCompleted) {
    try {
      const statusData = await checkPaymentStatus(linkId);

      console.log('Payment status:', statusData.status);

      if (statusData.status === 'PAID') {
        console.log('Payment completed successfully!');
        isCompleted = true;
        // Optionally, handle the success here
      } else if (statusData.status === 'EXPIRED' || statusData.status === 'CANCELLED') {
        console.log('Payment was not completed.');
        isCompleted = true;
        // Optionally, handle the failure here
      } else {
        console.log('Payment not yet completed. Retrying...');
      }

      await new Promise((resolve) => setTimeout(resolve, interval)); // Wait for the interval
    } catch (error) {
      console.error('Error monitoring payment status:', error);
      break;
    }
  }
};
const generatePaymentLink = async (req, res) => {
  try {
    const userData = req.body;
    const events = Array.isArray(userData.customerDetails.events) ? userData.customerDetails.events : [];
    const eventsData = await Event.find({ title: { $in: events } });

    let totalPrice = 0;
    eventsData.forEach((e) => {
      totalPrice += e.price;
    });

    const uuid = uuidv4(); // Unique ID for the payment link

    // Step 1: Create payment link
    const response = await axios.post(
      'https://sandbox.cashfree.com/pg/links',
      {
        customer_details: {
          customer_phone: req.body.customerDetails.phone,
          customer_name: req.body.customerDetails.name,
          customer_email: req.body.customerDetails.email,
        },
        link_notify: {
          send_email: true,
          send_sms: true,
        },
        enable_invoice: true,
        link_id: uuid,
        link_amount: totalPrice,
        link_currency: 'INR',
        link_purpose: 'Payment',
        link_partial_payments: false,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2023-08-01',
          'x-client-id': 'TEST1034921662b6cfc52c511b087d6f61294301',
          'x-client-secret': 'cfsk_ma_test_565e8000bb3de8b2e1efcf0616ee3256_627c314c',
        },
      }
    );

    if (response.data.link_url) {
      console.log(`Payment link created: ${response.data.link_url}`);

      // Send the payment link to the client
      res.status(200).json({
        paymentLink: response.data.link_url,
        linkId: response.data.link_id,
      });

      // Now start monitoring payment status
      chatBotPayment(response.data.link_id);
    }
  } catch (error) {
    console.log(error);
    res.send(error);
  }
};
const chatBotPayment = async (linkId) => {
  try {
    // Step 2: Monitor payment status
    const monitorPaymentStatus = async (linkId, ws) => {
      let isCompleted = false;

      while (!isCompleted) {
        try {
          const statusResponse = await axios.get(
            `https://sandbox.cashfree.com/pg/links/${linkId}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'x-api-version': '2023-08-01',
                'x-client-id': 'TEST1034921662b6cfc52c511b087d6f61294301',
                'x-client-secret': 'cfsk_ma_test_565e8000bb3de8b2e1efcf0616ee3256_627c314c',
              },
            }
          );

          const statusData = statusResponse.data;
          console.log(`Payment link_status: ${statusData.link_status}`);

          // Send status updates to the client via WebSocket
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ link_status: statusData.link_status }));
          }

          if (statusData.link_status === 'PAID') {
            console.log('Payment completed successfully!');
            isCompleted = true;
            //generate ticket pdf and send url using websocket
            //pdfUrl = generatepdf
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ status: 'success', message: 'Payment  completed!' }));
            }
          } else if (['EXPIRED', 'USER DROPPED', 'CANCELLED'].includes(statusData.link_status)) {
            console.log('Payment failed or expired.');
            isCompleted = true;
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ status: 'failure', message: 'Payment failed or expired.' }));
            }
          } else {
            console.log('Payment not yet completed. Retrying...');
          }

          // Wait for the interval before retrying
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          console.error('Error monitoring payment status:', error);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ status: 'error', message: 'Error monitoring payment status.' }));
          }
          isCompleted = true;
        }
      }
    };

    // Step 3: WebSocket connection to send updates
    wss.on('connection', (ws) => {
      monitorPaymentStatus(linkId, ws);
    });

  } catch (error) {
    console.error('Error in chatBotPayment:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

module.exports = {
  registerTeamUser, generatePaymentLink, chatBotPayment, registerSoloUser, initializeWebSocket,
  sendMessageToClient
};


// const encryptPDF = (filePath, password) => {
//   return new Promise((resolve, reject) => {
//     const encryptedPath = filePath.replace('.pdf', '_encrypted.pdf');
//     const command = `qpdf --encrypt ${password} ${password} 256 -- ${filePath} ${encryptedPath}`;

//     exec(command, (error, stdout, stderr) => {
//       if (error) {
//         console.error('Error encrypting PDF:', stderr);
//         return reject(error);
//       }
//       console.log('PDF encrypted successfully:', encryptedPath);
//       resolve(encryptedPath);
//     });
//   });
// };
