const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const validator = require('validator');
require('dotenv').config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 60 * 1000, 
  max: 5, 
  message: 'Too many requests, please try again later.'
});
app.use(limiter);

app.post('/send', async (req, res) => {
  let { name, email, subject, message, honeypot } = req.body;

  // Honeypot check
  if (honeypot) {
    return res.status(403).json({ message: 'Bot detected' });
  }

  // Sanitize input
  name = validator.escape(name.trim());
  email = validator.normalizeEmail(email);
  subject = validator.escape(subject.trim());
  message = validator.escape(message.trim());

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASS
      }
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: 'creativekinderland@gmail.com',
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Contact Message</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong><br>${message}</p>
      `
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Email sent successfully' });

  } catch (err) {
    console.error('Error sending email:', err);
    res.status(500).json({ message: 'Failed to send email' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
