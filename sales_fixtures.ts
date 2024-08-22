import { randomInt } from "crypto";
import request from "supertest";

import client from "../../modules/index.js";
import { product_fixture, warehouse_fixture } from "./proc_fixtures.js";
import { department_fixture, employee_fixture } from "./hr_fixtures.js";

export const treasury_fixture = async () => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.treasuries.create({
        data: {
            name: `Treasury ${randomInt(5_000_000)}`,
            active: true,
            archived: false,
            created_at: new Date(),
            updated_at: new Date(),
            created_by_user: {
                connect: {
                    user_id: creator.user_id,
                },
            },
            updated_by_user: {
                connect: {
                    user_id: creator.user_id,
                },
            },
            created_by_user_full_name: creator.full_name,
            updated_by_user_full_name: creator.full_name,
            created_by_user_username: creator.username,
            updated_by_user_username: creator.username,
            deleted: false,
            total: 5000,
        },
    });
};

export const pos_fixture = async () => {
    const treasury = await treasury_fixture();
    const warehouse = await warehouse_fixture();
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.points_of_sales.create({
        data: {
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
            active: true,
            archived: false,
            deleted: false,

            name: `POS #${randomInt(5_000_000)}`,
            treasury: {
                connect: {
                    treasury_id: Number(treasury.treasury_id),
                },
            },
            warehouse: {
                connect: {
                    warehouse_id: Number(warehouse.warehouse_id),
                },
            },
            tarif_list: undefined,
        },
    });
};

export const client_fixture = async () => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.clients.create({
        data: {
            updated_by_user: { connect: { user_id: creator.user_id } },
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
            created_by_user: { connect: { user_id: creator.user_id } },
            created_by_user_username: creator.username,
            created_by_user_full_name: creator.full_name,
            name: `client ${randomInt(5_000_000)}`,
            contact_person_name: "Contact name",
            phone: `${randomInt(5_000_000)}`,
            city: undefined,
        },
    });
};

export const sales_invoice_fixture = async () => {
    const dept = await department_fixture();

    const wh = await warehouse_fixture();
    const keeper_pos = await client.employment_positions.register(globalThis.admin, {
        title: `good title ${randomInt(500_000)}`,
        department_id: dept.department_id,
        role: "WAREHOUSE_KEEPER",
        role_data: {
            warehouse_id: wh.warehouse_id,
        },
    });

    const keeper_emp = await employee_fixture(`employee ${randomInt(500_000)}`);

    const assign_keeper_response = await request(globalThis.app)
        .post("/server/api/corporate/departments/positions/assign")
        .set("Authorization", globalThis.admin_token)
        .send({
            department_id: dept.department_id,
            employment_position_id: keeper_pos.employment_position_id,
            employee_id: keeper_emp.employee_id,
        });

    if (assign_keeper_response.status !== 200) {
        throw new Error("Failed to assign warehouse keeper role to employee");
    }

    const pos = await client.employment_positions.register(globalThis.admin, {
        title: `good title ${randomInt(500_000)}`,
        department_id: dept.department_id,
        role: "SALES_REP",
        role_data: {
            sales_rep_commission: 10,
        },
    });

    const emp1 = await employee_fixture(`employee ${randomInt(500_000)}`);

    const assign_response = await request(globalThis.app)
        .post("/server/api/corporate/departments/positions/assign")
        .set("Authorization", globalThis.admin_token)
        .send({
            department_id: dept.department_id,
            employment_position_id: pos.employment_position_id,
            employee_id: emp1.employee_id,
        });

    if (assign_response.status !== 200) {
        throw new Error("Failed to assign sales rep role to employee");
    }

    const product = await product_fixture();

    await client.warehouses_products.create({
        data: {
            warehouse: { connect: { warehouse_id: wh.warehouse_id } },
            product: { connect: { product_id: product.product_id } },
            amount: 50,
        },
    });

    const category = await client.product_categories.create({
        data: {
            created_at: new Date(),
            created_by_user: {
                connect: {
                    user_id: globalThis.admin.user_id,
                },
            },
            created_by_user_full_name: globalThis.admin.full_name,
            created_by_user_username: globalThis.admin.username,
            updated_at: new Date(),
            updated_by_user: {
                connect: {
                    user_id: globalThis.admin.user_id,
                },
            },
            updated_by_user_full_name: globalThis.admin.full_name,
            updated_by_user_username: globalThis.admin.username,
            deleted: false,
            price_per_unit: 500,
            purchase_price_per_unit: 50,
            piece_count: 50,
            name: `cool cat ${randomInt(500_000)}`,
            product: {
                connect: {
                    product_id: product.product_id,
                },
            },
        },
    });

    const cl = await client_fixture();

    const due_payment_date = new Date(Date.now() + 1000 * 60 * 60 * 24);

    const create_invoice_resp = await request(globalThis.app)
        .post("/server/api/sales/invoices/register/one")
        .set("Authorization", globalThis.admin_token)
        .send({
            due_payment_date,
            sales_rep_id: pos.employment_position_id,
            client_id: cl.client_id,
            products_list: [
                {
                    product_id: product.product_id,
                    category_id: category.category_id,
                    quantity: 1,
                    category_purchase_price: 5,
                },
            ],
            keeper_id: keeper_pos.employment_position_id,
            discount_percentage: false,
            discount: 0,
        });

    if (create_invoice_resp.status !== 200) {
        console.log(create_invoice_resp.body);
        throw new Error("Failed to create invoice");
    }

    return await client.sales_invoices.findFirstOrThrow({
        where: { invoice_id: create_invoice_resp.body.result.sales_invoice.invoice_id },
    });
};
