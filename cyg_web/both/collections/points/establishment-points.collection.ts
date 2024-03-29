import { MongoObservable } from 'meteor-rxjs';
import { EstablishmentPoint } from '../../models/points/establishment-point.model';

/**
 * Function to validate if user exists
 */
function loggedIn(){
    return !!Meteor.user();
}

/**
 * EstablishmentPoints Collection
 */
export const EstablishmentPoints = new MongoObservable.Collection<EstablishmentPoint>('establishment_points');

/**
 * Allow EstablishmentPoints collection insert, update and remove functions
 */
EstablishmentPoints.allow({
    insert: loggedIn,
    update: loggedIn,
    remove: loggedIn,
});