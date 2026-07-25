const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'test') {
    // Use mock for tests
    const nodemailerMock = require('nodemailer-mock');
    transporter = nodemailerMock.createTransport({});
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return transporter;
}

async function sendEmail({ to, subject, html }) {
  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: process.env.EMAIL_FROM || 'MedTrace <noreply@medtrace.com>',
      to,
      subject,
      html
    });
    logger.info({ messageId: info.messageId, to }, 'Email sent');
    return info;
  } catch (error) {
    logger.error({ error: error.message, to }, 'Failed to send email');
    throw error;
  }
}

function generateOtpEmail(otp, name) {
  return {
    subject: 'MedTrace - Your OTP for Access Request',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0B2545; font-size: 22px; margin: 0;">MedTrace</h1>
          <p style="color: #4A5568; font-size: 14px;">Medical History Platform</p>
        </div>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="color: #1B263B; font-size: 16px;">Hello ${name},</p>
          <p style="color: #4A5568; font-size: 14px;">A doctor has requested access to your medical records. Use the following OTP to grant access:</p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #E7EEF9; padding: 16px 32px; border-radius: 8px; letter-spacing: 8px; font-family: 'JetBrains Mono', monospace; font-size: 28px; color: #1B4B91; font-weight: bold;">${otp}</div>
          </div>
          <p style="color: #8B95A5; font-size: 12px;">This OTP expires in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
        <div style="text-align: center; margin-top: 16px;">
          <p style="color: #8B95A5; font-size: 12px;">© 2024 MedTrace. Secure medical record access.</p>
        </div>
      </div>
    `
  };
}

function generateGlassBreakEmail(patientName, nomineeName, doctorName, hospitalName) {
  return {
    subject: '⚠️ MedTrace Alert - Emergency Access to Your Medical Records',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #FDECEE; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #A31621; font-size: 22px; margin: 0;">⚠️ Emergency Access</h1>
          <p style="color: #4A5568; font-size: 14px;">MedTrace - Glass-Break Protocol Activated</p>
        </div>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="color: #1B263B; font-size: 16px;">Dear ${nomineeName},</p>
          <p style="color: #4A5568; font-size: 14px;">Emergency (Glass-Break) access has been granted to the medical records of <strong>${patientName}</strong>.</p>
          <div style="background: #F1F4F9; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #1B263B; font-size: 14px;"><strong>Doctor:</strong> ${doctorName}</p>
            <p style="margin: 4px 0; color: #1B263B; font-size: 14px;"><strong>Hospital:</strong> ${hospitalName}</p>
            <p style="margin: 4px 0; color: #1B263B; font-size: 14px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p style="color: #8B95A5; font-size: 12px;">Only minimum necessary fields (blood group, allergies, medications, emergency contact) were accessed. If you believe this was unauthorized, please contact the hospital administration immediately.</p>
        </div>
      </div>
    `
  };
}

function generateOtpEmailForLogin(otp, name) {
  return {
    subject: 'MedTrace - Your Login Verification Code',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #F8FAFC; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #0B2545; font-size: 22px; margin: 0;">MedTrace</h1>
          <p style="color: #4A5568; font-size: 14px;">Login Verification</p>
        </div>
        <div style="background: #FFFFFF; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <p style="color: #1B263B; font-size: 16px;">Hello ${name},</p>
          <p style="color: #4A5568; font-size: 14px;">Use the following code to complete your login:</p>
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #E7EEF9; padding: 16px 32px; border-radius: 8px; letter-spacing: 8px; font-family: 'JetBrains Mono', monospace; font-size: 28px; color: #1B4B91; font-weight: bold;">${otp}</div>
          </div>
          <p style="color: #8B95A5; font-size: 12px;">This code expires in 10 minutes. If you did not attempt to login, please secure your account.</p>
        </div>
      </div>
    `
  };
}

module.exports = { sendEmail, generateOtpEmail, generateGlassBreakEmail, generateOtpEmailForLogin };