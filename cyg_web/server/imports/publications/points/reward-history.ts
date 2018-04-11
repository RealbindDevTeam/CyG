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