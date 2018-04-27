import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EstablishmentPoints } from '../../../../both/collections/points/establishment-points.collection';

/**
 * Meteor publication establishment points by ids
 * @param {string[]} _pIds
 */
Meteor.publish('getEstablishmentPointsByIds', function (_pIds: string[]) {
    return EstablishmentPoints.find({ establishment_id: { $in: _pIds } });
});



/**
 * Meteor publication establishment points by user
 * @param {string} user_id
 */
Meteor.publish('getEstablishmentPointsByUser', function (_userId: string) {
    return EstablishmentPoints.find({ creation_user: _userId })
});
