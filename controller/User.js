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
              <p>Best Regards,<br>The Cyberia Team</p>
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
    doc.fontSize(23).text("Your Event Ticket", { align: "center" });   
   
    const pageWidth = doc.page.width;  // Get the page width
    const qrCodeSize = 150;            // Define the size of the QR code (150x150)
    const qrCodeX = (pageWidth - qrCodeSize) / 2; // Calculate the x position to center the image
    
    // Add the QR code using absolute positioning
    doc.image(qrCodeData, qrCodeX, doc.y, {
      fit: [qrCodeSize, qrCodeSize],   // Fit the image within 150x150
    });

    doc.moveDown(7);

    doc.fontSize(16)
      .text(`Dear ${req.body.teamName},`, { align: 'left' })
      .moveDown()
      .text(`We're thrilled that you'll be joining us for ${req.body.events} on 24 Dec! Your tickets are attached to this email.`)
      .moveDown()
      .text('You can download the tickets from the link attached with this.')
      .moveDown()
      .text('Event Details:', { align: 'left' })
      .moveDown()
      .text(`• Event Name: ${req.body.events}`)
      .text(`• Venue: The Maharaja Sayajirao University of Baroda | Faculty of Science | Department of Computer Application`)
      .moveDown()
      
      .text('You do not need to print your ticket. A digital version will be sufficient for entry. Simply present the ticket on your phone or device when you arrive.')
      .moveDown()
      .text('We can’t wait to welcome you to the event!', { align: 'left' })
      .moveDown()
      .text('Best regards,', { align: 'left' })
      .moveDown()
      .text(req.body.fullName)  // assuming 'organizerName' is part of the request body  
      .text("Cyberia Team") // assuming 'organizerOrganization' is part of the request body
      .text("9408802605") // assuming 'contactInfo' is part of the request body
      .moveDown();
    
    // Add the QR code to the PDF
    
    
    doc.end();// End the PDF generation


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
              <p>Please find your ticket attached. </p>
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
        // const rep = await transporter.sendMail(mailOptions);
        // console.log(rep)
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              // return res.status(500).json({ error: 'Failed to send email' });
              console.log(error)
          }
          else{
            console.log(info.response)
            res.status(200).json({ success: 'Email sent successfully' });
          }
      });
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
    doc.fontSize(23).text("Your Event Ticket", { align: "center" });   
   
    const pageWidth = doc.page.width;  // Get the page width
    const qrCodeSize = 150;            // Define the size of the QR code (150x150)
    const qrCodeX = (pageWidth - qrCodeSize) / 2; // Calculate the x position to center the image
    
    // Add the QR code using absolute positioning
    doc.image(qrCodeData, qrCodeX, doc.y, {
      fit: [qrCodeSize, qrCodeSize],   // Fit the image within 150x150
    });

    doc.moveDown(7);

    doc.fontSize(16)
      .text(`Dear ${req.body.fullName},`, { align: 'left' })
      .moveDown()
      .text(`We're thrilled that you'll be joining us for ${req.body.events} on 24 Dec! Your tickets are attached to this email.`)
      .moveDown()
      .text('You can download the tickets from the link attached with this.')
      .moveDown()
      .text('Event Details:', { align: 'left' })
      .moveDown()
      .text(`• Event Name: ${req.body.events}`)
      .text(`• Venue: The Maharaja Sayajirao University of Baroda | Faculty of Science | Department of Computer Application`)
      .moveDown()
      
      .text('You do not need to print your ticket. A digital version will be sufficient for entry. Simply present the ticket on your phone or device when you arrive.')
      .moveDown()
      .text('We can’t wait to welcome you to the event!', { align: 'left' })
      .moveDown()
      .text('Best regards,', { align: 'left' })
      .moveDown()
      .text(req.body.fullName)  // assuming 'organizerName' is part of the request body  
      .text("Cyberia Team") // assuming 'organizerOrganization' is part of the request body
      .text("9408802605") // assuming 'contactInfo' is part of the request body
      .moveDown();
    
    // Add the QR code to the PDF
    
    
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
