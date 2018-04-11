import { Meteor } from 'meteor/meteor';
import { Countries } from '../../../../both/collections/general/country.collection';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../both/models/establishment/establishment.model';
import { check } from 'meteor/check';

/**
 * Meteor publication countries
 */
Meteor.publish('countries', function () {
    return Countries.find({ is_active: true });
});

/**
 * Country by establishment
 */
Meteor.publish('getCountryByEstablishmentId', function (_establishmentId: string) {
    check(_establishmentId, String);
    let establishment = Establishments.findOne({ _id: _establishmentId });
    if (establishment) {
        return Countries.find({ _id: establishment.countryId });
    } else {
        return Countries.find({ is_active: true });;
    }
});

/**
 * Meteor publication return countries by establishments Id
 */
Meteor.publish('getCountriesByEstablishmentsId', function (_establishmentsId: string[]) {
    let _ids: string[] = [];
    Establishments.collection.find({ _id: { $in: _establishmentsId } }).forEach(function <Establishment>(establishment, index, ar) {
        _ids.push(establishment.countryId);
    });
    return Countries.find({ _id: { $in: _ids } });
});
