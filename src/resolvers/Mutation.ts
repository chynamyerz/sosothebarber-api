import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import moment from "moment";
import {
  Prisma,
  UserCreateInput,
  UserUpdateInput,
} from "../generated/prisma-client";
import { transport, mailContent } from "../util";
interface IContext {
  prisma: Prisma;
  request: any;
}
// Defining user update interface
interface IUserUpdate extends UserUpdateInput {
  newPassword?: string;
}
export const Mutation = {
  signup: async (_: any, {email, displayName, phoneNumber, password}: UserCreateInput, ctx: IContext) => {
    try {
      // Password mus be at least 5 charectors long
      if (password.length < 5) {
        throw Error("Password must be 5 charectors long.");
      }
      // Make username lower case and trim the white spaces
      email = email.toLocaleLowerCase().trim()
      // Check if the iser already exists
      if ((await ctx.prisma.users({where: {email}})).length) {
        throw Error("User already exists.");
      }
      // Hash password before stored in the database.
      const hashedPassword = await bcrypt.hash(password, 10);
      await ctx.prisma.createUser({
        email,
        displayName,
        phoneNumber,
        password: hashedPassword
      })
      return {
        message: "Signed up, all set."
      };
    } catch (error) {
      throw Error(error.message);
    }
  },
  signin: async (_: any, {email, password}: {email: string; password: string}, ctx: IContext) => {
    try {
      // Make username lower case and trim the white spaces
      email = email.toLocaleLowerCase().trim()
      
      const user = await ctx.prisma.user({
        email
      })
      // Check if the iser exists
      if (!user) {
        throw Error(`Provided email address "${email}" does not exist.`);
      }
      if (user && !await bcrypt.compare(password, user.password)) {
        throw Error("Invalid password");
      }
      const token = jwt.sign(
        {
          id: user.id,
        },
        "soso-the-barber-jwt-secret",
        {
          expiresIn: "24h",
        }
      );  
      
      return {
        token,
        user: {
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role: user.role
        }
      }
    } catch (error) {
      throw Error(error.message)
    }
  },
  async updateUser(root: any, {email, displayName, phoneNumber, password, newPassword}: IUserUpdate, ctx: IContext) {
    try {
      const authorizationHeader = ctx.request.headers['x-access-token'] || ctx.request.headers['authorization'];
      if (!authorizationHeader) {
        throw new Error("You must be logged in to update user information.");
      }
      const token = authorizationHeader.split(" ")[1];
      const signedIn = jwt.verify(token, "soso-the-barber-jwt-secret");
      const { id } = (signedIn as any);
      // Logged in user information
      const user = await ctx.prisma.user({ id });
      if (!user) {
        throw new Error("Please make sure you are logged in");
      }
      // Check if the user password is corrct
      if (!await bcrypt.compare(password ? password : "", user.password)) {
        throw new Error("Please provide a correct user password");
      }
      // An object holding arguments to update
      const userToUpdate: IUserUpdate = {};
      // If user display name is to change
      if (displayName) {
        userToUpdate.displayName = displayName;
      }
      // If user email is to change
      if (email && email !== user.email) {
        // Transform email address to lowercase.
        email = email.trim().toLowerCase();
        // Check if the submitted email for registering already exists.
        if (await ctx.prisma.user({ email })) {
          throw new Error("Email address already exists.");
        }
        userToUpdate.email = email;
      }
       // If user password is to change
      if (newPassword) {
        // Hash password before stored in the database.
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        userToUpdate.password = hashedPassword;
      }
      // If user contact is to change
      if (phoneNumber) {
        userToUpdate.phoneNumber = phoneNumber;
      }
      await ctx.prisma.updateUser({
        where: {
          id
        },
        data: userToUpdate
      });
      return { message: "Updated successfully" };
    } catch (error) {
      throw Error("Something went wrong")
    }
  },
  async requestPasswordReset(_: any, {email}: {email: string}, ctx: IContext) {
    // Transform email address to lowercase.
    email = email.trim().toLowerCase();
    // Check if this is a real user
    const user = await ctx.prisma.user({ email});
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    // Set a reset one time pin and expiry on that user
    const oneTimePin = (Math.random() * 10000).toFixed();
    const resetTokenExpiry = moment(Date.now())
      .add(1, "hours")
      .toDate();
    await ctx.prisma.updateUser({
      where: { email },
      data: { oneTimePin, resetTokenExpiry }
    });
    try {
      const message = `
        Someone (probably you) has requested to reset your password for the Soso-The-Barber app.<br><br>
        Please use the OTP below to change the password:<br><br>
        OTP: ${oneTimePin}<br><br>
        If you have not requested to reset your password there is no need for any action from your side.
      `
      const html = mailContent(user.displayName, message);
      const email = {
        from: "sosothebarber@gmail.com",
        to: user.email,
        subject: "Reset your password for the Soso-The-barber",
        html
      };
      await transport.sendMail(email);
    } catch (e) {
      throw new Error(
        `The email with the password reset token could not be sent to ${
          user.email
        }.`
      );
    }
    return { message: "Requested password change successfully" };
  },
  /**
   * Reset the password
   *
   * @param root parent
   * @param args arguments
   * @param ctx context
   *
   * Returns the success message
   */
  async resetPassword(root: any, {oneTimePin, password}: {oneTimePin: string; password: string}, ctx: IContext) {
    // Check if its a legit one time pin
    // And check if the one time pin is not expired
    const [user] = await ctx.prisma.users({
      where: {
        oneTimePin,
        resetTokenExpiry_gte: moment(Date.now()).toDate()
      }
    });
    if (!user) {
      throw new Error(
        "This one time pin is either invalid or expired. \nPlease re-request another one"
      );
    }
    // Hash the new password
    password = await bcrypt.hash(password, 10);
    // Save the new password to the user and remove old one time pin fields
    await ctx.prisma.updateUser({
      where: {
        email: user.email
      },
      data: {
        password,
        oneTimePin: "",
        resetTokenExpiry: moment(Date.now()).toDate()
      }
    });
    return { message: "Password changed successfully" };
  },
  bookPending: async (_: any, {cutId, dayTime}: {cutId: string; dayTime: string}, ctx: IContext) => {
    try {
      const authorizationHeader = ctx.request.headers['x-access-token'] || ctx.request.headers['authorization'];
      if (!authorizationHeader) {
        throw new Error("You must be logged in to update user information.");
      }
      const token = authorizationHeader.split(" ")[1];
      let signedIn;
      try {
        signedIn = jwt.verify(token, "soso-the-barber-jwt-secret");
      } catch (error) {
        throw new Error('Your session has expired, please sign in again.')
      }
      const { id } = (signedIn as any);
      
			const date = moment(dayTime).format("YYYY-MM-DD")
			
      // Check if there is no booking with time within an hour of the booking to be made.
      const avalaible = await ctx.prisma.bookings({
        where: {
          date,
          OR: {
            time_gte: moment(dayTime).subtract(1, "hours").toISOString(),
            time_lte: moment(dayTime).add(1, "hours").toISOString(),
          },
          status_in: ["ACTIVE", "PENDING"]
        }
			})
			
      if (avalaible.length > 0) {
        throw Error(`Your barber is cutting someone during that time, please book for the time which is an hour from the time you chose.`)
      }
      const booking = await ctx.prisma.createBooking({
        cut: {
          connect: {
            id: cutId
          }
        },
        user: {
          connect: {
            id
          }
        },
        status: "PENDING",
        date,
        time: dayTime
      })
      return {
        message: booking.id
      }
    } catch (error) {
      throw Error(error.message);
    }
  },
  bookSucceed: async (_: any, {bookingId, status}: {bookingId: string; status: boolean}, ctx: IContext) => {
    try {
      const authorizationHeader = ctx.request.headers['x-access-token'] || ctx.request.headers['authorization'];
      if (!authorizationHeader) {
        throw new Error("You must be logged in to update user information.");
      }
      const token = authorizationHeader.split(" ")[1];
      let signedIn;
      try {
        signedIn = jwt.verify(token, "soso-the-barber-jwt-secret");
      } catch (error) {
        throw new Error('Your session has expired, please sign in again.')
      }
      const { id } = (signedIn as any);
      // Logged in user information
      const user = await ctx.prisma.user({ id });
      if (!user) {
        throw new Error("We could not find your information, please try again later.");
      }
      if (status) {
        const userMessage = `
          You recently booked for a hair cut through Soso-The-Barber app.<br />
          This email serves to confirm that your booking was successful and Soso-The-Barber is aware of it.<br /><br />
          Booking information can be viewed in the app under Bookings.<br />
          You will recieve a communication from Soso-The-Barber prio to the cutting confirming the arrival.
        `
        const userContentEmail = mailContent(user.displayName, userMessage);

        const adminMessage = `
          This email servers as an alert concerning a recent booking that has just been made by ${user.displayName}<br /><br />
          Please navigate to the Bookings screen in the app to see the details.
          Remember to contact the user prio to the cutting.
        `
        const adminContentEmail = mailContent("Soso-The-Barber", adminMessage);
        
        await ctx.prisma.updateBooking({where:{id: bookingId}, data:{status: "ACTIVE"}})
        try {
      
          const userEmail = {
            from: "sosothebarber@gmail.com",
            to: user.email,
            subject: "Soso-The-Barber booking confirmation.",
            html: userContentEmail
          };
    
          await transport.sendMail(userEmail);
          
          const admintEmail = {
            from: "sosothebarber@gmail.com",
            to: "sosothebarber@gmail.com",
            subject: "Soso-The-Barber booking confirmation.",
            html: adminContentEmail
          };
    
          await transport.sendMail(admintEmail);
        } catch (e) {
          throw new Error(
            `We tried to send an email but it failed, please check Bookings in the app for your booking information.`
          );
        }    
        return {
          message: `Booking is complete!`
        }
      }
      await ctx.prisma.deleteBooking({id: bookingId})
      return {
        message: `Booking incomplete!`
      }
    } catch (error) {
      throw Error(error.message);
    }
  },
  cancelBooking: async (_: any, {bookingId}: {bookingId: string}, ctx: IContext) => {
    try {
      const authorizationHeader = ctx.request.headers['x-access-token'] || ctx.request.headers['authorization'];
      if (!authorizationHeader) {
        throw new Error("You must be logged in to update user information.");
      }
      const token = authorizationHeader.split(" ")[1];
      let signedIn;
      try {
        signedIn = jwt.verify(token, "soso-the-barber-jwt-secret");
      } catch (error) {
        throw new Error('Your session has expired, please sign in again.')
      }
      const { id } = (signedIn as any);
      // Logged in user information
      const user = await ctx.prisma.user({ id });
      if (!user) {
        throw new Error("We could not find your information, please try again later.");
      }
      const userMessage = `
      You recently cancelled your hair cut booking through Soso-The-Barber app.<br />
      This email serves to confirm that your booking was cancelled successfully and Soso-The-Barber is aware of it.<br /><br />
      You will be refunded 50% of the original booking amount. Please note, it may take up to 7 working days to proccess your refund.<br />
      You might recieve a communication from Soso-The-Barber to make sure a refund is done accordingly.<br /><br />
      Thank you.
      `
      const userContentEmail = mailContent(user.displayName, userMessage);

      const adminMessage = `
        This email servers as an alert concerning a recent booking cancellation that has just been made by ${user.displayName}<br /><br />
        Please navigate to the Bookings screen in the app to see the details, and process the refunds as accordingly.<br />
        Remember to contact the client to make sure you refund the right person.
      `
      const adminContentEmail = mailContent("Soso-The-Barber", adminMessage);
      await ctx.prisma.updateBooking({where:{id: bookingId}, data:{status: "CANCELLED"}})
      try {
        const userEmail = {
          from: "sosothebarber@gmail.com",
          to: user.email,
          subject: "Soso-The-Barber booking cancellation.",
          html: userContentEmail
        };
  
        await transport.sendMail(userEmail);
  
        const admintEmail = {
          from: "sosothebarber@gmail.com",
          to: "sosothebarber@gmail.com",
          subject: "Soso-The-Barber booking cancellation.",
          html: adminContentEmail
        };
  
        await transport.sendMail(admintEmail);
  
      } catch (e) {
        throw new Error(
          `We tried to send an email but it failed, please check Bookings in the app for your booking information.`
        );
      }
      return {
        message: `Booking is cancelled!`
      }
    } catch (error) {
      throw Error(error.message);
    }
  },
  manageBookings: async (_: any, {bookingId, action}: {bookingId: string, action: string}, ctx: IContext) => {
    try {
      const authorizationHeader = ctx.request.headers['x-access-token'] || ctx.request.headers['authorization'];
      if (!authorizationHeader) {
        throw new Error("You must be logged in to update user information.");
      }
      const token = authorizationHeader.split(" ")[1];
      let signedIn;
      try {
        signedIn = jwt.verify(token, "soso-the-barber-jwt-secret");
      } catch (error) {
        throw new Error('Your session has expired, please sign in again.')
      }
      const { id } = (signedIn as any);
      // Logged in user information
      const user = await ctx.prisma.user({ id });
      if (!user) {
        throw new Error("We could not find your information, please try again later.");
      }

      if (user.role !== "ADMIN") {
        if (action === "cancel") {
            await ctx.prisma.updateBooking({where:{id: bookingId}, data:{status: "CANCELLED"}})
            const userMessage = `
              You recently cancelled your hair cut booking through Soso-The-Barber app.<br />
              This email serves to confirm that your booking was cancelled successfully and Soso-The-Barber is aware of it.<br /><br />
              You will be refunded 50% of the original booking amount. Please note, it may take up to 7 working days to proccess your refund.<br />
              You might recieve a communication from Soso-The-Barber to make sure a refund is done accordingly.
            `
            const userContentEmail = mailContent(user.displayName, userMessage);

            const adminMessage = `
              This email servers as an alert concerning a recent booking cancellation that has just been made by ${user.displayName}<br /><br />
              Please navigate to the Bookings screen in the app to see the details, and process the refunds as accordingly.<br />
              Remember to contact the client to make sure you refund the right person.
            `
            const adminContentEmail = mailContent("Soso-The-Barber", adminMessage);
            try {
              const userEmail = {
                from: "sosothebarber@gmail.com",
                to: user.email,
                subject: "Soso-The-Barber booking cancellation.",
                html: userContentEmail
              };
        
              await transport.sendMail(userEmail);
        
              const admintEmail = {
                from: "sosothebarber@gmail.com",
                to: "sosothebarber@gmail.com",
                subject: "Soso-The-Barber booking cancellation.",
                html: adminContentEmail
              };
        
              await transport.sendMail(admintEmail);
        
            } catch (e) {
              throw new Error(
                `We tried to send an email to ${user.email} but it failed, please check Bookings in the app for your booking information.`
              );
            }
            return {
              message: `Booking is cancelled.`
            }
        } 
        
        if (action == 'paynow') {
          const bookingStillPending = ctx.prisma.booking({id: bookingId})
          if (!bookingStillPending) {
            throw new Error('The booking no longer exist, this may be due to delaying making payment on time.')
          }
          return {
            message: `You can still pay`
          }
        }else {
          throw new Error("You are not allowed here");
        }
      } else {
        const userBooking: any = await ctx.prisma.booking({id: bookingId}).$fragment(`{
          id
          status
          createdAt
          user{
            email
            displayName
          }
        }`);

        if (action === "done") {
          await ctx.prisma.updateBooking({where:{id: bookingId}, data:{status: "DONE"}})
          const userMessage = "Soso-The-Barber thank you so much for giving you a cut!. <br />Hope to see you again"
          const userContentEmail = mailContent(userBooking.user.displayName, userMessage)
          
          const adminMessage = `This email servers as an alert concerning a recent cut done to ${userBooking.user.displayName}.`
          const adminContentEmail = mailContent("Soso-The-Barber", adminMessage);
          try {
            const userEmail = {
              from: "sosothebarber@gmail.com",
              to: userBooking.user.email,
              subject: "Soso-The-Barber booking cancellation.",
              html: userContentEmail
            };
      
            await transport.sendMail(userEmail);
      
            const admintEmail = {
              from: "sosothebarber@gmail.com",
              to: "sosothebarber@gmail.com",
              subject: "Soso-The-Barber booking cancellation.",
              html: adminContentEmail
            };
      
            await transport.sendMail(admintEmail);
      
          } catch (e) {
            throw new Error(
              `We tried to send an email but it failed, please check Bookings in the app for your booking information.`
            );
          }
          return {
            message: `Booking is done!`
          }
        }

        if (action === "cancel") {
          await ctx.prisma.updateBooking({where:{id: bookingId}, data:{status: "CANCELLED"}})
          const userMessage = `
            Soso-The-Barber has cancelled your booking slot!.<br />
            This may be due to you delayed for over 15 minutes.<br />
            If that is the case, note that there will be no refunds to be made.<br />
            If you are still on time, please liase with Soso-The-Barber and find the reason why your slot was cancelled.<br />
            Hope to see you again.
          `
          const userContentEmail = mailContent(userBooking.user.displayName, userMessage);
  
          const adminMessage = `This email servers as an alert concerning booking cancelation you made for ${userBooking.user.displayName}.`
          const adminContentEmail = mailContent("Soso-The-Barber", adminMessage);
          try {
            const userEmail = {
              from: "sosothebarber@gmail.com",
              to: userBooking.user.email,
              subject: "Soso-The-Barber booking cancellation.",
              html: userContentEmail
            };
      
            await transport.sendMail(userEmail);
      
            const admintEmail = {
              from: "sosothebarber@gmail.com",
              to: "sosothebarber@gmail.com",
              subject: "Soso-The-Barber booking cancellation.",
              html: adminContentEmail
            };
      
            await transport.sendMail(admintEmail);
      
          } catch (e) {
            throw new Error(
              `We tried to send an email but it failed, please check Bookings in the app for your booking information.`
            );
          }
          return {
            message: `Booking is cancelled.`
          }
        }
        
        if (action === "refresh") {
          if (userBooking && userBooking.status === "PENDING") {
            if (moment(Date.now()).isAfter(moment(userBooking.createdAt).add(10, "minutes"))) {
              const response = await ctx.prisma.deleteBooking({id: bookingId});
              
              const userMessage = `
              You made a booking, but did not pay on time.<br />
              This email serves to inform you that, your booking no longer exists.
              `
              const userContentEmail = mailContent(userBooking.user.displayName, userMessage);
  
              const adminMessage = `
                This email servers as an alert concerning a pending payment that was not made on time by ${userBooking.user.displayName}<br /><br />
                The booking no longer exixts.
              `
              const adminContentEmail = mailContent("Soso-The-Barber", adminMessage);
              try {
                const userEmail = {
                  from: "sosothebarber@gmail.com",
                  to: userBooking.user.email,
                  subject: "Soso-The-Barber booking cancellation.",
                  html: userContentEmail
                };
          
                await transport.sendMail(userEmail);
          
                const admintEmail = {
                  from: "sosothebarber@gmail.com",
                  to: "sosothebarber@gmail.com",
                  subject: "Soso-The-Barber booking cancellation.",
                  html: adminContentEmail
                };
          
                await transport.sendMail(admintEmail);
          
              } catch (e) {
                throw new Error(
                  `We tried to send an email but it failed, please check Bookings in the app for your booking information.`
                );
              }
              return {
                message: `Booking no longer exist!`
              }
            } else {
              return {
                message: `Lets give the client some more minuts!`
              }
            }
          }
        }
      }
      return {
        message: `No changes were made`
      }
    } catch (error) {
      throw Error(error.message);
    }
  }
};
