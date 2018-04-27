import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { RewardHistories } from '../../../../both/collections/points/reward-history.collection';

/**
 * Meteor publication rewards histories by establishment id
 * @param {string} _pEstablishmentId
 */
Meteor.publish('getRewardHistoriesByEstablishmentId', function (_pEstablishmentId: string) {
    check(_pEstablishmentId, String);
    return RewardHistories.find({ establishment_id: _pEstablishmentId });
});

/**
 * Meteor publication rewards histories by user id
 */
Meteor.publish('getRewardHistoriesByUserId', function (_pUserId: string) {
    check(_pUserId, String);
    return RewardHistories.find({ creation_user: _pUserId });
});