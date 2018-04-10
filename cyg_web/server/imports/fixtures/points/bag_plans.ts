import { BagPlan, PricePoints } from '../../../../both/models/points/bag-plan.model';
import { BagPlans } from '../../../../both/collections/points/bag-plans.collection';

export function loadBagPlans() {
    if (BagPlans.find().cursor.count() == 0) {
        const bagPlans: BagPlan[] = [
            {
                _id: '100',
                name: 'free',
                label: 'BAG_PLAN.FREE',
                price: [{
                    country_id: "1900",
                    price: 0,
                    currency: 'COP'
                }],
                value_points: 350,
                active: true,
            },
            {
                _id: '200',
                name: 'small',
                label: 'BAG_PLAN.SMALL',
                price: [{
                    country_id: "1900",
                    price: 28900,
                    currency: 'COP'
                }],
                value_points: 300,
                active: true,
            },
            {
                _id: '300',
                name: 'medium',
                label: 'BAG_PLAN.MEDIUM',
                price: [{
                    country_id: "1900",
                    price: 34900,
                    currency: 'COP'
                }],
                value_points: 500,
                active: true,
            },
            {
                _id: '400',
                name: 'large',
                label: 'BAG_PLAN.LARGE',
                price: [{
                    country_id: "1900",
                    price: 38900,
                    currency: 'COP'
                }],
                value_points: 700,
                active: true,
            }
        ];

        bagPlans.forEach((bagPlan: BagPlan) => BagPlans.insert(bagPlan));
    }
}