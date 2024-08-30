import request from "supertest";

import client from "$/server/modules/index.js";
import { randomInt } from "crypto";
import { department_fixture, employee_fixture } from "./hr_fixtures.js";
import { customer_fixture } from "./account_fixtures.js";

export const importer_fixture = async (props: any = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.importers.create({
        data: {
            updated_by_user: { connect: { user_id: creator.user_id } },
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
            created_by_user: { connect: { user_id: creator.user_id } },
            created_by_user_username: creator.username,
            created_by_user_full_name: creator.full_name,
            name: `importer no ${randomInt(500_000)}`,
            phone: `${randomInt(5_000_000)}`,
            ...props,
        },
    });
};

export const product_fixture = async (props: any = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.products.create({
        data: {
            updated_by_user: { connect: { user_id: creator.user_id } },
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
            created_by_user: { connect: { user_id: creator.user_id } },
            created_by_user_username: creator.username,
            created_by_user_full_name: creator.full_name,
            name: `product ${randomInt(500_000)}`,
            has_expiration_date: false,
            require_expiration_date: false,
            notify_near_expiration: false,
            price: randomInt(5000),
            purchase_price_per_piece: randomInt(500),
            product_code: "code",
            manufacturer: undefined,
            product_categories: {
                createMany: {
                    data: [
                        {
                            updated_by_user_id: creator.user_id,
                            updated_by_user_username: creator.username,
                            updated_by_user_full_name: creator.full_name,
                            created_by_user_id: creator.user_id,
                            created_by_user_username: creator.username,
                            created_by_user_full_name: creator.full_name,
                            name: "Piece",
                            piece_count: 1,
                            price_per_unit: randomInt(5000),
                            purchase_price_per_unit: randomInt(500),
                        },
                    ],
                },
            },
            ...props,
        },
    });
};

export const warehouse_fixture = async (props: any = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });

    return await client.warehouses.create({
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

            name: `warehouse ${randomInt(50_000)}`,
            city: undefined,
            address: "Tripoli",
            lat: 50.5,
            lng: 50.5,
            ...props,
        },
    });
};

export const invoice_fixture = async () => {
    const dept = await department_fixture();
    const warehouse = await warehouse_fixture();

    await client.employment_positions.register(globalThis.admin, {
        title: `good title ${randomInt(500_000)}`,
        department_id: dept.department_id,
        role: "WAREHOUSE_KEEPER",
        role_data: {
            warehouse_id: warehouse.warehouse_id,
        },
    });

    const emp1 = await employee_fixture(`employee ${randomInt(500_000)}`);

    const pos = await client.employment_positions.register(globalThis.admin, {
        title: `good title ${randomInt(500_000)}`,
        department_id: dept.department_id,
        role: "WAREHOUSE_KEEPER",
        role_data: {
            warehouse_id: warehouse.warehouse_id,
        },
    });

    const assign_response = await request(globalThis.app)
        .post("/server/api/dashboard/corporate/departments/positions/assign")
        .set("x-app", "operator-dashboard")
        .set("Authorization", globalThis.admin_token)
        .send({
            department_id: dept.department_id,
            employment_position_id: pos.employment_position_id,
            employee_id: emp1.employee_id,
        });

    if (assign_response.status !== 200) {
        throw assign_response.body;
    }

    const importer = await importer_fixture();
    const product = await product_fixture();

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

    const response = await request(globalThis.app)
        .post("/server/api/dashboard/purchases/invoices/register/one")
        .send({
            keeper_id: pos.employment_position_id,
            importer_id: importer.importer_id,
            products_list: [
                {
                    product_id: product.product_id,
                    category_id: category.category_id,
                    quantity: 1,
                    category_purchase_price: 5,
                },
            ],
            keeper: {
                employee_id: emp1.employee_id,
            },
            expenses: 400,
        })
        .set("x-app", "operator-dashboard")
        .set("Authorization", globalThis.admin_token);

    const raw_invoice = response.body.result.created_purchases_invoice;
    return await client.purchases_invoices.findUniqueOrThrow({ where: { invoice_id: raw_invoice.invoice_id } });
};

export const foreign_purchase_invoice = async () => {
    const dept = await department_fixture();
    const emp = await employee_fixture(`employee ${randomInt(5_000_000)}`);

    await client.warehouses.deleteMany({ where: { name: "nice warehouse" } });
    const warehouse = await warehouse_fixture({ name: "nice warehouse" });

    await client.employment_positions.deleteMany({ where: { title: "keeper" } });
    const pos = await client.employment_positions.register(globalThis.admin, {
        title: "keeper",
        department_id: dept.department_id,
        role: "WAREHOUSE_KEEPER",
        role_data: {
            warehouse_id: warehouse.warehouse_id,
        },
    });

    const assign_response = await request(globalThis.app)
        .post("/server/api/corporate/departments/positions/assign")
        .set("Authorization", globalThis.admin_token)
        .send({
            department_id: dept.department_id,
            employment_position_id: pos.employment_position_id,
            employee_id: emp.employee_id,
        });

    if (assign_response.status !== 200) {
        throw new Error("Could not assign employee to position");
    }

    await client.importers.deleteMany({ where: { name: "importer name" } });
    const importer = await importer_fixture({ name: "importer name" });

    await client.products.deleteMany({ where: { name: "foreign product" } });
    const product = await product_fixture({ name: "foreign product", product_code: "foreign code" });

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

    const response = await request(globalThis.app)
        .post("/server/api/foreign_purchases/invoices/register/one")
        .send({
            keeper_id: pos.employment_position_id,
            importer_id: importer.importer_id,
            warehouse_name: `${pos.title} - ${warehouse.name}`,
            importer_name: importer.name,
            expenses: 500,
            products_list: [
                {
                    product_id: product.product_id,
                    product_code: product.product_code,
                    category_id: category.category_id,
                    category_name: category.name,
                    quantity: 1,
                    category_purchase_price: 5,
                },
            ],
            foreign_currency_name: "U.S. Dollar",
            foreign_currency_price: 200,
        })
        .set("Authorization", globalThis.admin_token);

    const invoice_id = response.body.result.invoice.invoice_id;
    return await client.foreign_purchases_invoices.findFirstOrThrow({ where: { invoice_id } });
};

export const manufacturer_fixture = async (props = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const now = new Date();

    return await client.manufacturers.create({
        data: {
            name: `Manufacturer #${randomInt(5_000_000)}`,
            deleted: false,
            created_at: now,
            updated_at: now,

            created_by_user_id: creator.user_id,
            created_by_user_username: creator.username,
            created_by_user_full_name: creator.full_name,

            updated_by_user_id: creator.user_id,
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
            ...props,
        },
    });
};

export const assets_type_fixture = async (props = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const now = new Date();

    return await client.asset_types.create({
        data: {
            name: `Manufacturer #${randomInt(5_000_000)}`,
            deleted: false,
            created_at: now,
            updated_at: now,

            created_by_user_id: creator.user_id,
            created_by_user_username: creator.username,
            created_by_user_full_name: creator.full_name,

            updated_by_user_id: creator.user_id,
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
            ...props,
        },
    });
};

export const asset_fixture = async (props = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const now = new Date();
    const type = await assets_type_fixture();

    return await client.assets.create({
        data: {
            name: `Manufacturer #${randomInt(5_000_000)}`,
            type_id: type.type_id,
            deleted: false,
            created_at: now,
            updated_at: now,

            created_by_user_id: creator.user_id,
            created_by_user_username: creator.username,
            created_by_user_full_name: creator.full_name,

            updated_by_user_id: creator.user_id,
            updated_by_user_username: creator.username,
            updated_by_user_full_name: creator.full_name,
            ...props,
        },
    });
};

export const asset_log_fixture = async (props = {}) => {
    const asset = await asset_fixture();

    return await client.asset_logs.create({
        data: {
            asset_id: asset.asset_id,
            content: "foo is great baz in none",
            ...props,
        },
    });
};

export const customer_address_fixture = async (props = {}) => {
    const customer = await customer_fixture();
    return await client.customer_addresses.create({
        data: {
            customer_id: customer.customer?.customer_id as number,
            description: "FOO",
            deleted: false,
            lat: 50,
            lng: 50,
            ...props,
        },
    });
};
