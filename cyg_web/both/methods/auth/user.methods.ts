import { Meteor } from 'meteor/meteor';
import { User } from '../../models/auth/user.model';
import { UserDetail, UserDetailPenalty } from '../../models/auth/user-detail.model';
import { UserDetails } from '../../collections/auth/user-detail.collection';
import { WaiterCallDetails } from '../../collections/establishment/waiter-call-detail.collection';
import { Table } from '../../models/establishment/table.model';
import { Tables } from '../../collections/establishment/table.collection';
import { UserPenalties } from '../../collections/auth/user-penalty.collection';
import { Parameters } from '../../collections/general/parameter.collection';
import { Parameter } from '../../models/general/parameter.model';

if (Meteor.isServer) {
    Meteor.methods({
        penalizeCustomer: function (_pCustomerUser: User) {
            let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _pCustomerUser._id });
            let _lUserDetailPenalty: UserDetailPenalty = { date: new Date() };
            UserDetails.update({ _id: _lUserDetail._id }, { $push: { penalties: _lUserDetailPenalty } });

            let _lUserDetailAux: UserDetail = UserDetails.findOne({ _id: _lUserDetail._id });
            let _lMaxUserPenalties: Parameter = Parameters.findOne({ name: 'max_user_penalties' });
            if (_lUserDetailAux.penalties.length >= Number(_lMaxUserPenalties.value)) {
                let _lLast_date: Date = new Date(Math.max.apply(null, _lUserDetailAux.penalties.map(function (p) { return new Date(p.date); })));
                UserPenalties.insert({
                    user_id: _pCustomerUser._id,
                    is_active: true,
                    last_date: _lLast_date,
                    penalties: _lUserDetailAux.penalties
                });
                UserDetails.update({ _id: _lUserDetail._id }, { $set: { penalties: [] } });
            }
        }
    });
}