const nodemailer = require('nodemailer');
require('dotenv').config();

function sendEmail(email, verificationCode) {

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS  
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de verificación',
    text: `Tu código de verificación es: ${verificationCode}`,
    html: `<p>Este es un <b>correo automático</b>.</p>
           <p>Tu código de verificación es: <b>${verificationCode}</b></p>`
  };

  return transporter.sendMail(mailOptions)
}


module.exports = sendEmail;