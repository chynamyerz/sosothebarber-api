import { createTransport } from "nodemailer";

const transport = createTransport({
  auth: {
    pass: process.env.SOSO_MAIL_PASSWORD,
    user: process.env.SOSO_MAIL_USER
  },
  service: process.env.SOSO_MAIL_SERVICE,
});

const mailContent = (displayName: string, message: string)  => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Soso-The-Barber</title>
</head>
<body style="margin: 0; padding: 20px;">
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
            <td bgcolor="#f0ffff" style="padding: 10px 10px 10px 10px;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td style="font-family: Arial, sans-serif; font-size: 14px;" width="75%">
                    &nbsp;&nbsp;&nbsp;&nbsp;&copy; Soso-The-Barber 2020<br/>
                  </td>
                  <td align="right" width="25%">
                    <table border="0" cellpadding="0" cellspacing="0">
                      <tr>                        
                        <td style="font-size: 0; line-height: 0;" width="200">&nbsp;</td>
                        <td style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">
                          <a href="" style="color: black;">
                            <img src="https://res.cloudinary.com/myezasifiso/image/upload/v1586626004/sickfits/app-store-ios-brands.svg" alt="App Store" width="38" height="38" style="display: block;" border="0" />
                          </a>
                        </td>
                        <td style="font-size: 0; line-height: 0;" width="50">&nbsp;</td>
                        <td style="font-family: Arial, sans-serif; font-size: 12px; font-weight: bold;">
                          <a href="" style="color: black;">
                            <img src="https://res.cloudinary.com/myezasifiso/image/upload/v1586625760/sickfits/google-play-brands.svg" alt="Play Store" width="38" height="38" style="display: block;" border="0" />
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
