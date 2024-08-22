import bcrypt from "bcrypt";
import { randomInt } from "crypto";

import env from "$/server/env.js";
import client from "$/server/modules/index.js";
import crypto from "crypto";
import User from "../../modules/User/index.js";
import { department_fixture, employee_fixture } from "./hr_fixtures.js";

const default_password = "123123123123";
const default_password_hash = bcrypt.hashSync(default_password, env.auth.bcrypt.rounds);

const get_user_defaults = () => ({
    full_name: `name ${randomInt(500_000)}`,
    username: `username_${randomInt(500_000)}`,
    email: `email${randomInt(500_000)}@gmail.com`,
    phone: randomInt(500_000).toString(),
    user_type: "OTHER" as "OTHER",
    active: true,
});

const user_fixture = async (props = {}) => {
    const props_with_defaults = { ...get_user_defaults(), ...props };
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.users.create({
        data: {
            ...props_with_defaults,
            password: default_password_hash,
            archived: false,
            deleted: false,
            created_at: new Date(),
            created_by_user: {
                connect: {
                    user_id: creator.user_id,
                },
            },
            created_by_user_username: creator.username,
            created_by_user_full_name: creator.full_name,
            updated_at: new Date(),
            updated_by_user: {
                connect: {
                    user_id: creator.user_id,
                },
            },
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
        },
    });
};

const driver_fixture = async (props = { account: {}, driver_record: {} }) => {
    const driver_account_props_override = props.account || {};
    const driver_record_props_override = props.driver_record || {};

    const admin = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const employee = await employee_fixture(`employee ${randomInt(5_000_00)}`);
    const dept = await department_fixture();

    const account = await user_fixture({ user_type: "DRIVER_APP_ACCOUNT", ...driver_account_props_override });

    const position = await client.employment_positions.create({
        data: {
            title: `position for ${employee.name}`,
            employee_id: employee.employee_id,
            department_id: dept.department_id,
            created_at: new Date(),
            updated_at: new Date(),
            created_by_user_id: admin.user_id,
            created_by_user_full_name: admin.full_name,
            created_by_user_username: admin.username,
            updated_by_user_id: admin.user_id,
            updated_by_user_full_name: admin.full_name,
            updated_by_user_username: admin.username,
            role: "DRIVER",
        },
    });

    const now = new Date();

    const data = await client.drivers.create({
        data: {
            created_at: now,
            updated_at: now,

            created_by_user_id: admin.user_id,
            created_by_user_full_name: admin.full_name,
            created_by_user_username: admin.username,

            updated_by_user_id: admin.user_id,
            updated_by_user_full_name: admin.full_name,
            updated_by_user_username: admin.username,
            user_id: account.user_id,
            ...driver_record_props_override,
        },
    });

    return { data, account, position };
};

const user_notification_fixture = async (props = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.user_notifications.create({
        data: {
            title: `Notification ${randomInt(500_000)}`,
            contents: `Lorem ${randomInt(5000_0000)}`,
            user_id: creator.user_id,
            read: false,
            ...props,
        },
    });
};

const customer_fixture = async (props = {}) => {
    const props_with_defaults = { ...get_user_defaults(), ...props };
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.users.create({
        data: {
            password: default_password_hash,
            archived: false,
            deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
            customer: {
                create: {
                    date_of_birth: new Date(),
                } as any,
            },
            ...props_with_defaults,
            user_type: "CUSTOMER",
        },
        include: {
            customer: true,
        },
    });
};

const register_and_log_in_customer = async () => {
    const customer = await customer_fixture();
    const { token } = await User.auth.login(customer.username, default_password);
    return { customer, token };
};

const notification_tag_fixture = async () => {
    return await client.notifications_tags.create({
        data: {
            label: `Label ${randomInt(5_000_000)}`,
        },
    });
};

const key_fixture = async (u) => {
    const identifier = crypto.randomUUID();
    const verifier = crypto.randomUUID();
    const verifier_hash = crypto.hash("sha256", verifier, "base64url");

    const token = `${identifier}:${verifier}`;

    const api_key = await client.api_keys.create({
        data: {
            identifier,
            verifier_hash,
            owner_id: u.user_id,
            name: `API KEY  #${crypto.randomInt(1_000_000)}`,
        },
    });

    return { api_key, token, identifier, verifier };
};

export {
    customer_fixture,
    default_password,
    default_password_hash,
    driver_fixture,
    key_fixture,
    notification_tag_fixture,
    register_and_log_in_customer,
    user_fixture,
    user_notification_fixture,
};
