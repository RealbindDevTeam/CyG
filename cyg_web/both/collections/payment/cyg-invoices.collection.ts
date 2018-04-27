import { MongoObservable } from 'meteor-rxjs';
import { Meteor } from 'meteor/meteor';
import { CygInvoice } from '../../models/payment/cyg-invoice.model';

export const CygInvoices = new MongoObservable.Collection<CygInvoice>('cyg_invoices');

/**
 * Function to validate if user exists
 */
function loggedIn() {
    return !!Meteor.user();
}

/**
 * Allow HistoryPaymentCollection collecion insert and update functions
 */
CygInvoices.allow({
    insert: loggedIn,
    update: loggedIn
});
