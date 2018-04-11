import { Meteor } from 'meteor/meteor';
import { Tables } from '../../../../both/collections/establishment/table.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';
import { UserDetail } from '../../../../both/models/auth/user-detail.model';
import { check } from 'meteor/check';

/**
 * Meteor publication tables with user creation condition
 * @param {string} _userId
 */
Meteor.publish('tables', function (_userId: string) {
    check(_userId, String);
    return Tables.find({ creation_user: _userId });
});

/**
 * Meteor publication return all tables
 */
Meteor.publish('getAllTables', function () {
    return Tables.find({});
});

/**
 * Meteor publication return tables with establishment condition
 * @param {string} _establishmentId
 */
Meteor.publish('getTablesByEstablishment', function (_establishmentId: string) {
    check(_establishmentId, String);
    return Tables.find({ establishment_id: _establishmentId, is_active: true });
});

/**
 * Meteor publication return tables by establishment Work
 * @param {string} _userId
 */
Meteor.publish('getTablesByEstablishmentWork', function (_userId: string) {
    check(_userId, String);
    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _userId });
    if (_lUserDetail) {
        return Tables.find({ establishment_id: _lUserDetail.establishment_work, is_active: true });
    } else {
        return;
    }
});
