import * as jwt from "jsonwebtoken";
import {
  Prisma,
} from "../generated/prisma-client";
// Defining the context interface
interface IContext {
  prisma: Prisma;
  request: any;
}
export const Query = {
  user: async (_: any, __: any, ctx: IContext) => {
    try {
      const authorizationHeader = ctx.request.headers['x-access-token'] || ctx.request.headers['authorization'];
      if (!authorizationHeader) {
        return null;
      }
      const token = authorizationHeader.split(" ")[1];
      const signedIn = jwt.verify(token, "soso-the-barber-jwt-secret");
      
      const { id } = (signedIn as any);
      const currentUser = await ctx.prisma.user({
        id
      });
      // const onlyActiveBookings = (currentUser as any).bookings.filter((booking: any) => booking.status == "ACTIVE");
      // return {...(currentUser as any), bookings: onlyActiveBookings };
      return currentUser;
    } catch (error) {
      return null;
    }
  },

  userWithBookings: async (_: any, __: any, ctx: IContext) => {
    try {
      const authorizationHeader = ctx.request.headers['x-access-token'] || ctx.request.headers['authorization'];
      if (!authorizationHeader) {
        return null;
      }
      const token = authorizationHeader.split(" ")[1];
      const signedIn = jwt.verify(token, "soso-the-barber-jwt-secret");
      
      const { id } = (signedIn as any);
      const currentUser = await ctx.prisma.user({
        id
      }).$fragment(`{
        id 
        email
        displayName
        phoneNumber
        role
        bookings {
          id
          status
          date
          time
          cut{
            id
            title
            price
            image
            description
          }
        }
      }`);
      
      return currentUser;
    } catch (error) {
      return null;
    }
  },

  users: async (_: any, __: any, ctx: IContext) => {
    try {
      return ctx.prisma.users();
    } catch (error) {
      throw Error(error.message);
    }
  },
  cuts: async (_: any, __: any, ctx: IContext) => {
    try {
      return ctx.prisma.cuts();
    } catch (error) {
      throw Error(error.message);
    }
  },
  bookings: async (_: any, __: any, ctx: IContext) => {
    try {
      return ctx.prisma.bookings().$fragment(`{
        id
        status
        date
        time
        cut{
          id
          title
          price
          image
          description
        }
      }`);
    } catch (error) {
      throw Error(error.message);
    }
  },

  bookingsWithUser: async (_: any, __: any, ctx: IContext) => {
    try {
      return ctx.prisma.bookings().$fragment(`{
        id
        status
        date
        time
        cut{
          id
          title
          price
          image
          description
        }
        user{
          id 
          email
          displayName
          phoneNumber
          role
        }
      }`);
    } catch (error) {
      throw Error(error.message);
    }
  },
}
