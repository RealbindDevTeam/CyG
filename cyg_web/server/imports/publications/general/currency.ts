import { Meteor } from 'meteor/meteor';
import { Currencies } from '../../../../both/collections/general/currency.collection';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../both/models/establishment/establishment.model';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';

/**
 * Meteor publication currencies
 */
Meteor.publish('currencies', () => Currencies.find({ isActive: true }));

/**
 * Meteor publication return currencies by establishments Id
 */
Meteor.publish('getCurrenciesByEstablishmentsId', function (_establishmentsId: string[]) {
    let _ids: string[] = [];
    Establishments.collection.find({ _id: { $in: _establishmentsId } }).forEach(function <Establishment>(establishment, index, ar) {
        _ids.push(establishment.currencyId);
    });
    return Currencies.find({ _id: { $in: _ids } });
});

/**
 * Meteor publication return currencies by  userId
 */
Meteor.publish('getCurrenciesByUserId', function (_userId: string) {
    let _currenciesIds: string[] = [];
    Establishments.collection.find({ creation_user: _userId }).forEach(function <Establishment>(establishment, index, args) {
        _currenciesIds.push(establishment.currencyId);
    });

    return Currencies.find({ _id: { $in: _currenciesIds } });
});
