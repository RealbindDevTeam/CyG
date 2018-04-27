import { Meteor } from 'meteor/meteor';
import { CygInvoices } from '../../../../both/collections/payment/cyg-invoices.collection';

/**
 * Meteor publication InvoicesInfo
 */
Meteor.publish('getAllCygInvoices', function () {
    return CygInvoices.find({});
});

Meteor.publish('getCygInvoiceByUser', function (_userId: string) {
    check(_userId, String);
    return CygInvoices.find({ creation_user: _userId });
});