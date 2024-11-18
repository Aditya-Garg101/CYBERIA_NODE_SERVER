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
const serviceAccount =  JSON.stringify(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)



if(!admin.apps.length){
  admin.initializeApp({
    credential:
    admin.credential.cert(serviceAccount)
    ,
    storageBucket : 'gs://e-commerce-backend-bfa60.appspot.com',
  })
}

const bucket = admin.storage().bucket()
const uploadToFirebase = async(filePath) => {
  const bucket = admin.storage().bucket();
  const mimeType =  mime.lookup(filePath);  
  const uploadResponse = await bucket.upload(filePath, {  
    destination: `pdfs/${filePath.split("/").pop()}`,
    public: true,
    metadata: {
      contentType: mimeType
      },
    });    
    return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(uploadResponse[0].name)}?alt=media`;
        
  };

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

    const pdfDirectory = path.join(__dirname, "../tickets");
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true }); // Create the directory if it doesn't exist
    }
    const filePath = path.join(pdfDirectory, `${req.body.fullName}.pdf`);

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("Your Event Ticket", { align: "center" });
    doc
      .fontSize(16)
      .text(`Dear ${req.body.teamName},`, { align: 'left' })
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
    doc.end();

    writeStream.on("finish", () => {
      console.log("PDF generated successfully:", filePath);
    });


    // const password = "MSUDCA"
    // const encryptedPath = await encryptPDF(filePath,password)

    
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
           <stong>Note : Qr will mark as disabled if once Scanned!!</strong>
          </div>
          <p>We look forward to seeing you at the event!</p>
          <p>Best Regards,<br>The ${req.body.events} Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `${req.body.events}_Ticket.pdf`,
          path: filePath,
        },
      ],
    };


    // Step 6: Send the email
    await transporter.sendMail(mailOptions);

    if(filePath){
      const fileLink = await uploadToFirebase(filePath);
      console.log(fileLink)
      const TeamData = await TeamUser.create({
        ...req.body,
        qrString: uniqueID,
        ticket : fileLink
      });
      res
    .status(201)
    .json({ message: "QR Code generated and sent successfully!",  TeamData });
    }


    
  } catch (error) {
    console.error("Error generating QR code:", error);
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
    const pdfDirectory = path.join(__dirname, "../tickets");
    if (!fs.existsSync(pdfDirectory)) {
      fs.mkdirSync(pdfDirectory, { recursive: true }); // Create the directory if it doesn't exist
    }
    const filePath = path.join(pdfDirectory, `${uniqueID}.pdf`);

    const doc = new PDFDocument();
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    doc.fontSize(20).text("Your Event Ticket", { align: "center" });
    doc
      .fontSize(16)
      .text(`Dear ${req.body.fullName},`, { align: 'left' })
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
    doc.end();

    writeStream.on("finish", () => {
      console.log("PDF generated successfully:", filePath);
    });


    // const password = req.body.fullName.split(" ") + req.body.age
    // console.log(password)
    // const encryptedPath = await encryptPDF(filePath,password)

    
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
          </div>          
          <p>We look forward to seeing you at the event!</p>
          <p>We look forward to seeing you at the event!</p>
          <p>Note : Qr will mark as disabled if once Scanned, So keep it secured!!</p>
          <p>Best Regards,<br>The ${req.body.events} Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `${req.body.events}_Ticket.pdf`,
          path: filePath,
        },
      ],
    };

    

    // Step 6: Send the email
    await transporter.sendMail(mailOptions);         
    // const formData = new FormData();
    //     formData.append('title', 'Sample PDF');
    //     formData.append('description', 'Test description');
    //     formData.append('file', filePath);
        // const headers = formData.getHeaders()
    // // await pb.admins.authWithPassword('adityagarg646@gmail.com', 'DeepAditya@10');    
    // // // console.log("Data",formData)            
    // // const filePath2 = fs.ReadStream(filePath)
    // const record = await pb.collection('pdfFile').create({file:filePath2})
    // console.log(record)
    if(filePath){
      const fileLink = await uploadToFirebase(filePath);
      console.log(fileLink)
      const SoloData = await SoloUser.create({
        ...req.body,
        qrString: uniqueID,    
        ticket : fileLink     
      });
      res
      .status(201)
      .json({ message: "QR Code generated and sent successfully!", SoloData });
    }

    
      
     

   
  } catch (error) {
    console.error("Error generating QR code:", error);
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
