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
const admin = require("firebase-admin")
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)




// if(!admin.apps.length){
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY,
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     }),
//     storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
//   });
// }


if(!admin.apps.length){
  admin.initializeApp({
    credential:
    admin.credential.cert(serviceAccount)
    ,
    storageBucket : 'gs://e-commerce-backend-bfa60.appspot.com',
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
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.password,
      },
    });

    // Step 3: Validate email input
    if (!req.body.email) {
      return res.status(304).send("Recipient's email is required");
    }

    // Step 4: Create PDF in-memory (no need to save to the filesystem)
    const doc = new PDFDocument();
    
    // Prepare an in-memory buffer to write the PDF to
    const pdfBuffer = [];
    doc.on('data', chunk => pdfBuffer.push(chunk));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(pdfBuffer);

      try {
        // Step 5: Upload the PDF to Firebase Storage
        const pdfFileName = `${uniqueID}_ticket.pdf`;
        const pdfUploadPath = `tickets/${pdfFileName}`; // Customize the path if needed

        // Upload the PDF file to Firebase Storage
        const firebaseStorageRef = admin.storage().bucket().file(pdfUploadPath);
        await firebaseStorageRef.save(pdfData, {
          contentType: 'application/pdf',
          public: true, // Make the file publicly accessible
        });

        // Get the public URL of the uploaded file
        const fileLink = `https://storage.googleapis.com/${firebaseStorageRef.bucket.name}/${firebaseStorageRef.name}`;

        // Step 6: Send the email with the Firebase URL as an attachment link
        const mailOptions = {
          from: process.env.email,
          to: req.body.email,
          subject: `Your Ticket for ${req.body.events}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
              <h2 style="text-align: center; color: #0073e6;">Your Event Ticket</h2>
              <p>Dear ${req.body.teamName},</p>
              <p>Thank you for registering for <strong>${req.body.events}</strong>!</p>
              <p>Please find your ticket attached. <strong>Use the password below to open the PDF:</strong></p>
              <div style="background-color: #f2f2f2; padding: 10px; border-radius: 5px; text-align: center; font-size: 18px;">
                <a href="${fileLink}" target="_blank">Download Your Ticket</a>
              </div>          
              <p>We look forward to seeing you at the event!</p>
              <p>Note: QR code will be disabled once scanned, so keep it secure!</p>
              <p>Best Regards,<br>The ${req.body.events} Team</p>
            </div>
          `,
        };

        // Step 7: Send the email
        await transporter.sendMail(mailOptions);

        // Step 8: Save user details in the database with the Firebase link
        const TeamData = await TeamUser.create({
          ...req.body,
          qrString: uniqueID,
          ticket: fileLink, // Firebase link to the PDF
        });

        res.status(201).json({
          message: "QR Code generated and sent successfully!",
          TeamData,
        });

      } catch (uploadError) {
        console.error("Error uploading to Firebase:", uploadError);
        res.status(500).json({ message: "Error uploading the ticket to Firebase" });
      }
    });

    // Generate the PDF content
    doc.fontSize(20).text("Your Event Ticket", { align: "center" });
    doc.fontSize(16).text(`Dear ${req.body.teamName},`, { align: 'left' })
      .moveDown()
      .text(`Event: ${req.body.events}`)
      .text(`Date: 24 Dec`)
      .text(`Location: The Maharaja Sayajirao University of Baroda | Faculty of Science | Department of Computer Application`)
      .moveDown()
      .text('Scan the QR code below for entry:', { align: 'left' });

    // Add the QR code to the PDF
    doc.image(qrCodeData, {
      fit: [150, 150],
      align: 'center',
    });

    doc.end(); // End the PDF generation

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
      service: "gmail",
      auth: {
        user: process.env.email,
        pass: process.env.password,
      },
    });

    // Step 3: Validate email input
    if (!req.body.email) {
      return res.status(304).send("Recipient's email is required");
    }

    // Step 4: Create PDF in-memory (no need to save to the filesystem)
    const doc = new PDFDocument();
    
    // Prepare an in-memory buffer to write the PDF to
    const pdfBuffer = [];
    doc.on('data', chunk => pdfBuffer.push(chunk));
    doc.on('end', async () => {
      const pdfData = Buffer.concat(pdfBuffer);

      try {
        // Step 5: Upload the PDF to Firebase Storage
        const pdfFileName = `${uniqueID}_ticket.pdf`;
        const pdfUploadPath = `tickets/${pdfFileName}`; // You can customize the path

        // Upload the PDF file to Firebase Storage
        const firebaseStorageRef = bucket.file(pdfUploadPath);
       await firebaseStorageRef.save(pdfData, {
          contentType: 'application/pdf',
          public: true, // Make the file publicly accessible
        });
        // Get the public URL of the uploaded file
        const fileLink = `https://storage.googleapis.com/${firebaseStorageRef.bucket.name}/${firebaseStorageRef.name}`;
        console.log(fileLink)
        // Step 6: Send the email with the Firebase URL as an attachment link
        const mailOptions = {
          from: process.env.email,
          to: req.body.email,
          subject: `Your Ticket for ${req.body.events}`,
          html: `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; max-width: 600px; margin: auto;">
              <h2 style="text-align: center; color: #0073e6;">Your Event Ticket</h2>
              <p>Dear ${req.body.fullName},</p>
              <p>Thank you for registering for <strong>${req.body.events}</strong>!</p>
              <p>Please find your ticket attached. <strong>Use the password below to open the PDF:</strong></p>
              <div style="background-color: #f2f2f2; padding: 10px; border-radius: 5px; text-align: center; font-size: 18px;">
                <a href="${fileLink}" target="_blank">Download Your Ticket</a>
              </div>          
              <p>We look forward to seeing you at the event!</p>
              <p>Note: QR code will be disabled once scanned, so keep it secure!</p>
              <p>Best Regards,<br>The ${req.body.events} Team</p>
            </div>
          `,
        };

        // Step 7: Send the email
        await transporter.sendMail(mailOptions);

        // Step 8: Save user details in the database with the Firebase link
        const SoloData = await SoloUser.create({
          ...req.body,
          qrString: uniqueID,
          ticket: fileLink, // Firebase link to the PDF
        });

        res.status(201).json({
          message: "QR Code generated and sent successfully!",
          SoloData,
        });

      } catch (error) {
        console.error("Error uploading to Firebase:", error);
        res.status(500).json({ message: "Error uploading the ticket to Firebase" });
      }
    });

    // Generate the PDF content
    doc.fontSize(20).text("Your Event Ticket", { align: "center" });
    doc.fontSize(16).text(`Dear ${req.body.fullName},`, { align: 'left' })
      .moveDown()
      .text(`Event: ${req.body.events}`)
      .text(`Date: 24 Dec`)
      .text(`Location: The Maharaja Sayajirao University of Baroda | Faculty of Science | Department of Computer Application`)
      .moveDown()
      .text('Scan the QR code below for entry:', { align: 'left' });

    // Add the QR code to the PDF
    doc.image(qrCodeData, {
      fit: [150, 150],
      align: 'center',
    });

    doc.end(); // End the PDF generation

  } catch (error) {
    console.error("Error generating QR code or email:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { registerTeamUser , registerSoloUser };


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
