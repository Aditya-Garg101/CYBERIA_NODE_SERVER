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
const serviceAccount = {
  "type": "service_account",
  "project_id": "e-commerce-backend-bfa60",
  "private_key_id": "a52ae616746a02916069c6c36ffbd35dc938eaca",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCsv57TFhmBV6aj\nCBBayJdUcn27F9zaLF5xFigCjPkKig+z4cDXy5swixxB2y7GsfbUayXvPGQdypTe\nUX1Tx87YLGjWwL+Q2+U5bP8+9LFVvgXcil5B9a5lKWHPAOtFBcmc0zBPVubhESvn\ngknubufC3h4zPGt0CAanX3Bh50Hcfe4fEel0pVAMLyvgIZfVEDYCN8HUnY019Nop\ntA0HuyT2EYu1wx20NnG/HvjRMOyLuM9D+87CJbiLmq6ccLxCRAqfoah8n4Um/BJX\nF+yeaCbFHe/F9uHvb5FoghdP41T9uFc2qTaRmIhdkoG4EHC00aRFKmbzwQjvp2so\nsvMOOc7BAgMBAAECggEAD+5A65b9ZaXrZlwDRBf9CqrfSO5vrcgLMpMYP/n3qn7m\naVCPm+b5Kg4eHj2kD+tQB7FU533SfsPUnDb4H46M1vcreOiAEhARUM0qMchXhUB3\nomm5PQx213nsPO6JA82/lMCOEzcApi9S9O/ZOQ2NvnUE5HU1NJdb47oDr2en9XkZ\nvrENjDH8Up8+ty5YkIn+axVYXfDsiBZcxshtZqPC+24A74DS+LcL5tYTwzTSKvjv\ntN3sjA5U3iPRffWFF3amTFtJb8ry3axITU2K/iZUdeidTkV3aRoDtrjwNXKHkn6y\nuWvspzALFT9fEYw2hfAfAyDMLqFTxBvPgmnYsAr11QKBgQDPCnpP8Ner607cRkyr\nR4ew33FuFVUslw7DuN2Cne7ke9TFHHjOtNESTK3Ke4+DDMR1hJn6X68n6uudYHdM\nRJhx+2Pk8dQjkPTOt9mxythE+h9EvyY/dpdKUbwKLpNhRvR8rT/dRTwwDpbrQhKA\nCFj6cORRAcREGUkhCtFXVf/nvQKBgQDVmTOtlPpcEAk+/Tt48+NxYhwScMVS0nlR\njjcTsSyp5eE5nwIW73f78WOs3c6tPtIDEhdAc2lSHo2DrF7MLDuEWhce//i6phYX\nJz//DSetWAhTwNFY1zig2zZNabZ/2ovDPCJNEA5aTuZlO+WaQeSakeAYnerVstD3\n4VDTM9ShVQKBgQDOycdKauHue1LDnY9cD1COr03KxpHQvHtprw3HNNjy6l+kFADx\nbBXZsi5uq6S2Hp1mRu/H66O1OeTkxgHBck3UomKuu37HmzN3+Jb9Bf2mPy/V6RlZ\nj6gh+arXfJeFNGpi0GOWLF2mHhxMkyyJJk1ArlrMMfiGj77DuttF4MZ8/QKBgGEI\nc92LLCDeeBTRXU8ZHF3JwA7wg/OYAdz2yjZ76lpUP/i5L23T46Hkiu9g5B73xtf2\nQ/HXfCT+FDOY/oeqIG+DrbU7e3bvNGHYRs5K35dzwnSpx3CgdO0+KHEKcQmr8ooC\nq2JuxNZpuWiLyUZGYN+HHVKRirkBvsSc6ubHSPTxAoGBAMkj2qaVlDsA8mfpks7j\nQVU1GqTga+vxm3sFwrOM+Js0mUJId5G5XDFQ5ue99Y9M01bRMQwKUavkaODXmrTj\nI8Mt5Jx2EeRk8FNfczHgHFU9CKfbektfacZKyEzIjcOO2PPGIEko6S05CW/K7LTP\nUCj2cTxYQnyPgcFcjtm27MwD\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-j4zn4@e-commerce-backend-bfa60.iam.gserviceaccount.com",
  "client_id": "112347859658337575349",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-j4zn4%40e-commerce-backend-bfa60.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}






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
