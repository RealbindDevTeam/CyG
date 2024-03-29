import { Roles } from '../../../../both/collections/auth/role.collection';
import { Role } from '../../../../both/models/auth/role.model';

export function loadRoles() {

    if (Roles.find().cursor.count() === 0) {

        const roles: Role[] = [{
            _id: "100",
            is_active: true,
            name: "ROLE.ADMINISTRATOR",
            description: "establishment administrator",
            menus: ["900", "1000", "2000", "3000", "10000", "15000", "16000", "20000"]
        }, {
            _id: "400",
            is_active: true,
            name: "ROLE.CUSTOMER",
            description: "establishment customer",
            menus: ["4000", "6000", "11000", "12000", "20000", "19000"]
        }, {
            _id: "600",
            is_active: true,
            name: "ROLE.SUPERVISOR",
            description: "establishment supervisor",
            menus: ["910", "1100", "1200", "20000"],
            user_prefix: 'sp'
        }];

        roles.forEach((role: Role) => Roles.insert(role));
    }
}