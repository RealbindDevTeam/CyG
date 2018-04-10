import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EstablishmentQRs } from '../../../../both/collections/establishment/establishment-qr.collection';

/**
 * Meteor publication getEstablishmentQRsByAdmin with creation user condition
 * @param {string} _userId
 */
Meteor.publish('getEstablishmentQRsByAdmin', function (_userId: string) {
    check(_userId, String);
    return EstablishmentQRs.find({ creation_user: _userId });
});