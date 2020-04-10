import { createTransport } from "nodemailer";

const transport = createTransport({
  auth: {
    pass: process.env.SOSO_MAIL_PASSWORD,
    user: process.env.SOSO_MAIL_USER
  },
  service: process.env.SOSO_MAIL_SERVICE,
});

const mailContent = (displayName: string, message: string)  => `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>Soso-The-Barber</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<script defer src="https://use.fontawesome.com/releases/v5.13.0/js/all.js"></script>
<link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.13.0/css/all.css">
</head>
<body style="margin: 0; padding: 0;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%"> 
    <tr>
      <td style="padding: 10px 0 30px 0;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="border: 1px solid #cccccc; border-collapse: collapse;">
          <tr>
            <td align="center" bgcolor="#f0ffff" style="color: #153643; font-size: 28px; font-weight: bold; font-family: Arial, sans-serif;">
              <img src="https://lh3.googleusercontent.com/qxth3RHLD_mr-jViaEyz1DLE4abE8gjZB7mTaZG1GyG-nCIw7lYTmBbFqV9x7jIGams=s360" alt="Soso-The-Barber Logo" width="100" height="100" style="display: block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#ffffff" style="padding: 40px 30px 0 30px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #153643; font-family: Arial, sans-serif; font-size: 16px;">
                    <b>Hi ${displayName}</b>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 0 10px 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                    ${message}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px 0 0 0; color: #153643; font-family: Arial, sans-serif; font-size: 16px; line-height: 20px;">
                  	<p>Thank you</p>
                    <p>Your one and only Soso the fucking barber</p>
                  </td>
                </tr>          
              </table>
            </td>
          </tr>     
          <tr>
            <td bgcolor="black" style="padding: 10px 10px 10px 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="color: #ffffff; font-family: Arial, sans-serif; font-size: 14px;" width="75%">
                    &nbsp;&nbsp;&nbsp;&nbsp;&copy; Soso-The-Barber 2020<br/>
                  </td>
                  <td align="right" width="25%">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">
                          <a href="http://www.twitter.com/" style="color: #f0ffff;">
                            <i class="fab fa-whatsapp" style="font-size:20px;color:#f0ffff;"></i>
                          </a>
                        </td>
                        <td style="font-size: 0; line-height: 0;" width="50">&nbsp;</td>
                        <td style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">
                          <a href="http://www.twitter.com/" style="color: #f0ffff;">
                            <i class="fab fa-instagram" style="font-size:20px;color:#f0ffff;"></i>
                          </a>
                        </td>
                        <td style="font-size: 0; line-height: 0;" width="50">&nbsp;</td>
                        <td style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">
                          <a href="http://www.twitter.com/" style="color: #f0ffff;">
                            <i class="fab fa-facebook" style="font-size:20px;color:#f0ffff;"></i>
                          </a>
                        </td>
                        <td style="font-size: 0; line-height: 0;" width="200">&nbsp;</td>
                        <td style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">
                          <a href="http://www.twitter.com/" style="color: #f0ffff;">
                            <i class="fab fa-app-store-ios" style="font-size:20px;color:#f0ffff;"></i>
                          </a>
                        </td>
                        <td style="font-size: 0; line-height: 0;" width="50">&nbsp;</td>
                        <td style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">
                          <a href="http://www.twitter.com/" style="color: #f0ffff;">
                            <i class="fab fa-google-play" style="font-size:20px;color:#f0ffff;"></i>
                          </a>
                        </td>
                        <td style="font-size: 0; line-height: 0;" width="50">&nbsp;</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
export { transport, mailContent }
