import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const createuser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    //if user already exists then do not create a new user
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .collect();


      //if not then insert a new user
      if(user?.length==0){
        await ctx.db.insert("users",{
            email:args.email,
            userName:args.name,
            imageUrl:args.imageUrl
        });

        return "Inserted new User";
      }
      return "User exists";
   
  },
});
