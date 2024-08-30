import { randomInt } from "crypto";
import client from "$/server/modules/index.js";
import { dash_date_formater } from "../common/index.js";

export const department_fixture = async (props = {}) => {
    const admin = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.departments.create({
        data: {
            created_by_user: {
                connect: {
                    user_id: admin.user_id,
                },
            },
            created_by_user_full_name: admin.full_name,
            created_by_user_username: admin.username,
            updated_by_user_username: admin.username,
            updated_by_user_full_name: admin.full_name,
            updated_by_user: {
                connect: {
                    user_id: admin.user_id,
                },
            },
            name: `department ${randomInt(500_000)}`,
            deleted: false,
            parent_department: undefined,
            created_at: new Date(),
            updated_at: new Date(),
            ...props,
        },
    });
};

export const position_fixture = async (data?, dept?) => {
    dept = dept || (await department_fixture());

    return await client.employment_positions.register(globalThis.admin, {
        title: `good title ${randomInt(500_000)}`,
        department_id: dept.department_id,
        role: "OTHER",
        ...data,
    });
};

export const employee_fixture = async (name) => {
    return await client.employees.create({
        data: {
            started_working_date: new Date(dash_date_formater(new Date("1999-11-08"), true, false).trim()),
            last_payment_date_on_registration: new Date(dash_date_formater(new Date("2023-11-21"), true, false).trim()),

            active: true,
            deleted: false,
            created_at: new Date(),
            updated_at: new Date(),
            created_by_user: {
                connect: {
                    user_id: 1,
                },
            },
            created_by_user_full_name: "Super Administrative User",
            created_by_user_username: "admin",
            updated_by_user: {
                connect: {
                    user_id: 1,
                },
            },
            updated_by_user_full_name: "Super Administrative User",
            updated_by_user_username: "admin",
            archived: false,
            email: `email${randomInt(500_000)}@gmail.com`,
            phone: `${randomInt(500_000)}`,
            name: name,
            fixed_salary: 5000,
        },
    });
};
