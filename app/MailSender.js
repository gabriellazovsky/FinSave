const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  
  }
});

const mailOptions = (email, verificationCode) => ({
  from: process.env.EMAIL_USER,
  to: `${email}`,
  subject: 'Correo de prueba desde Node.js',
  text: 'Hola, este es un correo enviado automáticamente desde Node.js',
  html: `<p>Este es un <b>correo enviado automáticamente</b> desde Node.js. Tu código de verificación es: ${verificationCode}</p>`
});

transporter.sendMail(mailOptions(email, verificationCode), (error, info) => {
  if (error) {
    return console.log('Error al enviar el correo:', error);
  }
  console.log('Correo enviado correctamente:', info.response);
});