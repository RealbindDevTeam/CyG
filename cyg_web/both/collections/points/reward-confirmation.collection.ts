import { MongoObservable } from 'meteor-rxjs';
import { RewardConfirmation } from '../../models/points/reward-confirmation.model';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * RewardsConfirmations Collection
 */
export const RewardsConfirmations = new MongoObservable.Collection<RewardConfirmation>('rewards_confirmations');

/**
 * Allow RewardsConfirmations collection insert and update functions
 */
RewardsConfirmations.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn
});