import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { RewardsConfirmations } from '../../../../both/collections/points/reward-confirmation.collection';

/**
 * Meteor publication rewards confirmation by establishment id
 * @param {string} _pEstablishmentId
 */
Meteor.publish('getRewardsConfirmationsByEstablishmentId', function (_pEstablishmentId: string) {
    check(_pEstablishmentId, String);
    return RewardsConfirmations.find({ establishment_id: _pEstablishmentId });
});