// apps/api/src/auth.ts: Better Auth inside the Worker, storing users in D1 (no ORM).
// Guest checkout needs none of this. It is for order lookup, accounts, and the admin sign-in.
// Tables: see playbook/04-auth.md step 3 (migrations/0001_auth.sql).
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { env } from "cloudflare:workers";
import { sendTransactional } from "./email";
import { deleteCustomerData } from "./customers";

export const auth = betterAuth({
  database: env.DB, // the D1 binding, used directly
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins: [env.WEB_ORIGIN],

  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await deleteCustomerData(user.id); // account and marketing data; order records the law requires are kept
      },
    },
  },

  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendTransactional({ to: email, subject: "Your sign-in link", text: `Tap to sign in: ${url}` });
      },
    }),
  ],
});
