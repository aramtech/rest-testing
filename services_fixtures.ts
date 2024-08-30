import client from "$/server/modules/index.js";
import { randomInt } from "crypto";

export const services_fixture = async (props: any = {}) => {
    const creator = await client.users.findUniqueOrThrow({ where: { user_id: 1 } });
    return await client.services.register_service(creator, {
        name: `service #${randomInt(500_000)}`,
        description: "description",
        default_price: 2500.3,
        deduction_value: 0.0,
        deduction_type: "fixed",
        ...props,
    });
};
