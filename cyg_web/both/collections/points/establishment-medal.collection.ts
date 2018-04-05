import { MongoObservable } from 'meteor-rxjs';
import { EstablishmentMedal } from '../../models/points/establishment-medal.model';

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * EstablishmentMedals Collection
 */
export const EstablishmentMedals = new MongoObservable.Collection<EstablishmentMedal>('establishment_medals');

EstablishmentMedals.allow({
    insert: loggedIn,
    update: loggedIn
});