import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EstablishmentMedals } from '../../../../both/collections/points/establishment-medal.collection';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';

/**
 * Meteor publication establishment medals by user id
 * @param {string} _pUserId
 */
Meteor.publish('getEstablishmentMedalsByUserId', function (_pUserId: string) {
    check(_pUserId, String);
    return EstablishmentMedals.find({ user_id: _pUserId });
});

/**
 * Meteor publication establishment medals by establishments array
 * @param {string[]} _establishmentArray
 */
Meteor.publish('getEstablishmentMedalsByArray', function (_establishmentArray: string[]) {
    return EstablishmentMedals.find({ establishment_id: { $in: _establishmentArray } });
});


/**
 * Meteor publication establishment medals by admin user
 * @param {string} _adminUserId
 */
Meteor['publishComposite']('getEstablishmentByAdminUsr', function (_adminUserId: string) {
    return {
        find() {
            return Establishments.find({ creation_user: _adminUserId });
        },
        children: [{
            find(establishment) {
                return EstablishmentMedals.find({ establishment_id: establishment._id });
            }
        }]
    };
});