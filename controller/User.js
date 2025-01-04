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
const { exec } = require("child_process");
dotenv.config();
const mime = require('mime');
const admin = require("firebase-admin");
const Event = require("../models/Events");
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)



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



const chatBotPayment = async (req, res) => {
  try {
    const userData = req.body;

    arr = ["CS2", "Live Sketching"]
    const events = Array.isArray(userData.events) ? userData.events : [];
    
    const eventsData = await Event.find({ title: events  });    
  
    const uuid = uuidv4();    
    let totalPrice = 0;
    eventsData.map((e) => {      
      totalPrice += e.price;
    })
    // res.send({eventsData});
    console.log(totalPrice) 
    
    // const link_id =   
    
    // console.log(userData);
      const response = await axios.post(
        'https://sandbox.cashfree.com/pg/links',
        {
          customer_details: {
            customer_phone: userData.customer_phone,
            customer_name: userData.customer_name,
            customer_email: userData.customer_email
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
            'x-api-version': '2023-08-01', // Replace with the correct version if needed
            // Replace with your actual client secret
          },
        }
      );
              
      res.status(201).send(response.data);
} catch (error) {
  console.log(error.message)
  res.status(500).json({ message: error.message });

}
}

module.exports = { registerTeamUser, chatBotPayment, registerSoloUser };


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
