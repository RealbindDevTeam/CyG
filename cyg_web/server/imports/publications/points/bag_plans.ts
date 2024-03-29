import { BagPlan } from '../../../../both/models/points/bag-plan.model';
import { BagPlans } from '../../../../both/collections/points/bag-plans.collection';

/**
 * Meteor publication bag plans
 * @param {string} _userId
 */
Meteor.publish('getBagPlans', function () {
    let _lBagsPlans = BagPlans.find({});
    return _lBagsPlans;
});


/**
 * Meteor publication bag plans
 * @param {string} _userId
 */
Meteor.publish('getBagPlansNoFree', function () {
    let _lBagsPlans = BagPlans.find({ name: { $nin: ['free'] } });
    return _lBagsPlans;
});