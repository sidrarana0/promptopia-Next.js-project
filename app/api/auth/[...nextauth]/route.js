import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { connectToDB } from '@utils/database';
import User from '@models/user';

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async session({ session }) {
      try {
        await connectToDB(); // Ensure the database is connected

        // Find the user in the database
        const sessionUser = await User.findOne({ email: session.user.email });

        if (sessionUser) {
          session.user.id = sessionUser._id.toString();
        } else {
          // Handle the case where the user is not found
          console.error('User not found in database');
          session.user.id = null; // or some other fallback
        }

        return session;
      } catch (error) {
        console.error('Error in session callback:', error);
        // Optionally handle the error
        return session;
      }
    },
    async signIn({ profile }) {
      try {
        await connectToDB();

        // Check if the user already exists
        const userExists = await User.findOne({ email: profile.email });

        // If not, create a new user
        if (!userExists) {
          await User.create({
            email: profile.email,
            username: profile.name.replace(/\s/g, "").toLowerCase(),
            image: profile.picture
          });
        }

        return true;
      } catch (error) {
        console.log('Error signing in:', error);
        return false;
      }
    }
  }
});

export { handler as GET, handler as POST };
