import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EstablishmentMedals } from '../../../../both/collections/points/establishment-medal.collection';

/**
 * Meteor publication establishment medals by user id
 * @param {string} _pUserId
 */
Meteor.publish('getEstablishmentMedalsByUserId', function (_pUserId: string) {
    check(_pUserId, String);
    return EstablishmentMedals.find({ user_id: _pUserId });
});