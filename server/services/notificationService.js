// Notification module (SAD 3.4): records every message in NOTIFICATION and delivers it through
// the mail adapter. A failed send never fails the user's request; the retry worker (Sprint 2)
// picks up FAILED rows with attempts < 3.
const Notification = require('../models/Notification');
const mailer = require('../adapters/mailer');
const logger = require('../config/logger');

const templates = {
  OTP_EMAIL: ({ name, otp }) => ({
    subject: 'Your Online Bookstore verification code',
    text: `Hi ${name},\n\nYour verification code is ${otp}. It is valid for 10 minutes.\n\nIf you did not create an account, ignore this e-mail.`,
  }),
  PASSWORD_RESET: ({ name, link }) => ({
    subject: 'Reset your Online Bookstore password',
    text: `Hi ${name},\n\nUse this link within 30 minutes to set a new password:\n${link}\n\nThe link works once. If you did not ask for this, ignore this e-mail.`,
  }),
  PASSWORD_CHANGED: ({ name }) => ({
    subject: 'Your Online Bookstore password was changed',
    text: `Hi ${name},\n\nYour password was just changed and all other sessions were signed out.`,
  }),
};

async function notify(user, type, data) {
  const { subject, text } = templates[type]({ name: user.name, ...data });
  const row = await Notification.create({ user_id: user._id, type, to: user.email, subject });
  try {
    await mailer.send({ to: user.email, subject, text });
    row.status = 'SENT';
    row.sent_at = new Date();
  } catch (err) {
    logger.warn({ err: err.message, type }, 'notification send failed; queued for retry');
    row.status = 'FAILED';
  }
  row.attempts += 1;
  await row.save();
  return row;
}

module.exports = { notify, templates };
