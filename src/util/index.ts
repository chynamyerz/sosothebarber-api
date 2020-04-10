import { createTransport } from "nodemailer";
const transport = createTransport({
  auth: {
    pass: process.env.SOSO_MAIL_PASSWORD,
    user: process.env.SOSO_MAIL_USER
  },
  service: process.env.SOSO_MAIL_SERVICE,
});
export { transport }
