import nodemailer from "nodemailer";

// Configure transporter
let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'vivekkumar99singhs@gmail.com',
    pass: 'rdpk uazo tqud rxrg'
  }
});

// Send email
const sendEmail = async (to) => {
  const mailOptions = {
    from: 'vivekkumar99singhs@gmail.com',
    subject: 'Application Received',
    to:to,
  text: 'We have received your application and resume. Thank you for applying.'
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export default sendEmail;