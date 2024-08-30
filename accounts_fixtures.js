import { randomInt } from "crypto";
import client from "$/server/database/prisma.js";
import bcrypt from "bcrypt";

export const user_fixture = async ({ password = "123123", username = `user_${randomInt(50_000)}`, active = true, archived = false, user_type = "OTHER" }) => {
    const password_hash = bcrypt.hashSync(password, 1);

    return await client.users.create({
        data: {
            full_name: "Super Administrative User",
            username,
            active,
            archived,

            default_home_page_name: "Dashboard",

            password: password_hash,
            user_type,
        },
    });
};
