import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { NegativePoints } from '../../../../both/collections/points/negative-points.collection';

/**
 * Meteor publication establishment negative points by id
 * @param {string} _pId
 */
Meteor.publish('getNegativePointsByEstablishmentId', function (_pId: string) {
    return NegativePoints.find({ establishment_id: _pId });
});

/**
 * Meteor publication negative poitns by establishments array
 */

Meteor.publish('getNegativePointsByEstablishmentsArray', function (_establishmentArray: string[]) {
    return NegativePoints.find({ "establishment_id": { $in: _establishmentArray } });
});