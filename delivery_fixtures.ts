import client from "$/server/modules/index.js";
import { randomInt } from "crypto";
import { department_fixture, employee_fixture } from "./hr_fixtures.js";
import { user_fixture } from "./account_fixtures.js";

export const vehicle_manufacturer_fixture = async (props = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const country = await client.countries.findFirstOrThrow();

    return await client.vehicles_manufacturers.register({
        requester: creator as any,
        country_id: country.country_id,
        name: `Manufacturer ${randomInt(500_000)}`,
        ...props,
    });
};

export const vehicle_model_fixture = async (props = {}) => {
    const admin = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const manufacturer = await vehicle_manufacturer_fixture();

    return await client.vehicles_models.register({
        requester: admin as any,
        manufacturer_id: manufacturer.manufacturer_id,
        year: 2021,
        name: `model ${randomInt(500_000)}`,
        ...props,
    });
};

export const vehicle_fixture = async (props = {}) => {
    const admin = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const vehicle_model = await vehicle_model_fixture();

    return await client.vehicles.register({
        requester: admin as any,
        model_id: vehicle_model.model_id,
        number: `${randomInt(500_000)}`,
        images: [],
        documents: [],
        ...props,
    });
};

export const driver_fixture = async (props = {}) => {
    const admin = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const employee = await employee_fixture(`employee ${randomInt(5_000_00)}`);
    const dept = await department_fixture();

    await client.employment_positions.create({
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

    return await client.drivers.create({
        data: {
            created_at: now,
            updated_at: now,

            created_by_user_id: admin.user_id,
            created_by_user_full_name: admin.full_name,
            created_by_user_username: admin.username,

            updated_by_user_id: admin.user_id,
            updated_by_user_full_name: admin.full_name,
            updated_by_user_username: admin.username,
        },
    });
};

export const fleet_fixture = async (props = {}) => {
    const admin = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    const country = await client.countries.findFirstOrThrow({ include: { cities: true } });
    const city = country.cities[0];
    const now = new Date();

    return await client.fleets.register({
        requester: admin as any,
        name: `Fleet ${randomInt(500_000)}`,
        ...props,
    });
};
