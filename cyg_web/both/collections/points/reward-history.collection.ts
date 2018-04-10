import { MongoObservable } from 'meteor-rxjs';
import { RewardHistory } from '../../models/points/reward-history.model';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * RewardHistories Collection
 */
export const RewardHistories = new MongoObservable.Collection<RewardHistory>('rewards_histories');

/**
 * Allow RewardHistories collection insert and update functions
 */
RewardHistories.allow({
    insert: loggedIn,
    update: loggedIn
});