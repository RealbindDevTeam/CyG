import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { PaymentMethods } from '../../../../both/collections/general/paymentMethod.collection';
import { Establishment } from '../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../both/collections/establishment/establishment.collection';
import { UserDetails } from '../../../../both/collections/auth/user-detail.collection';

/**
 * Meteor publication paymentMethods
 */
Meteor.publish( 'paymentMethods', () => PaymentMethods.find( { isActive: true } ) );

/*
 * Meteor publication return establishment payment methods
 */
Meteor.publish( 'getPaymentMethodsByEstablishmentId', function( _pEstablishmentId:string ){
    check( _pEstablishmentId, String );
    let _lEstablishment: Establishment = Establishments.findOne( { _id: _pEstablishmentId } );
    if( _lEstablishment ){
        return PaymentMethods.find( { _id: { $in: _lEstablishment.paymentMethods } , isActive: true } );        
    } else{
        return PaymentMethods.find( { isActive: true } );
    }
});