import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { EstablishmentQR } from '../../models/establishment/establishment-qr.model';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * EstablishmentQRs Collection
 */
export const EstablishmentQRs = new MongoObservable.Collection<EstablishmentQR>('establishment_qrs');

/**
 * Allow EstablishmentQRs collection insert and update functions
 */
EstablishmentQRs.allow({
    insert: loggedIn,
    update: loggedIn
});