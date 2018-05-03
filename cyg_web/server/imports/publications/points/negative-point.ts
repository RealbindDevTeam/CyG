import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { NegativePoints } from '../../../../both/collections/points/negative-points.collection';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';

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

/**
 * Meteor publication of negative points by creation_user
 * @param {string} _userId
 */
Meteor['publishComposite']('getNegativePointsByAdminUser', function (_adminUserId: string) {
    return {
        find() {
            return Establishments.find({ creation_user: _adminUserId });
        },
        children: [{
            find(establishment) {
                return NegativePoints.find({ establishment_id: establishment._id });
            }
        }]
    }
});