import { Meteor } from 'meteor/meteor';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { CustomValidators } from '../../../../../../../both/shared-components/validators/custom-validator';
import { CcPaymentMethods } from '../../../../../../../both/collections/payment/cc-payment-methods.collection';
import { CcPaymentMethod } from '../../../../../../../both/models/payment/cc-payment-method.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Parameter } from '../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../both/collections/general/parameter.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { CcRequestColombia, Merchant, Transaction, Order, Payer, TX_VALUE, TX_TAX, TX_TAX_RETURN_BASE, CreditCard, ExtraParameters, AdditionalValues, Buyer, ShippingBillingAddress } from '../../../../../../../both/models/payment/cc-request-colombia.model';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { PayuPaymentService } from '../../../services/payment/payu-payment.service';
import { PackageMedalService } from '../../../services/payment/package-medal.service';
import { Element } from '../../../../../../../both/models/points/establishment-point.model'

let md5 = require('md5');

@Component({
    selector: 'payment-form',
    templateUrl: './payment-form.component.html',
    styleUrls: ['./payment-form.component.scss']
})

export class PaymentFormComponent implements OnInit, OnDestroy {

    private _paymentLogoName: string = "";
    private _paymentForm: FormGroup = new FormGroup({});
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _selectedPaymentMethod: string;
    private _ccMethodPayment: string;

    private _cCPaymentMethodSub: Subscription;
    private _cCPaymentMethods: Observable<CcPaymentMethod[]>;


    /**
     * PayuPaymentFormComponent Constructor
     * @param {Router} _router 
     * @param {ActivatedRoute} _activateRoute 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {PayuPaymenteService} _payuPaymentService 
     * @param {NgZone} _ngZone 
     * @param {MatDialog} _mdDialog 
     * @param {DomSanitizer} _domSanitizer 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _router: Router,
        private _activateRoute: ActivatedRoute,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _payuPaymentService: PayuPaymentService,
        private _ngZone: NgZone,
        public _mdDialog: MatDialog,
        private _domSanitizer: DomSanitizer,
        private _userLanguageService: UserLanguageService,
        private _packageMedalService: PackageMedalService) {

        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

    }

    /**
    * ngOnInit Implementation
    */
    ngOnInit() {

        this.removeSubscriptions();
        this._paymentForm = new FormGroup({
            paymentMethod: new FormControl('', [Validators.required]),
            fullName: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(150)]),
            cardNumber: new FormControl('', [Validators.required, Validators.minLength(13), Validators.maxLength(20), CustomValidators.numericValidator])
        });

        this._cCPaymentMethodSub = MeteorObservable.subscribe('getCcPaymentMethods').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._cCPaymentMethods = CcPaymentMethods.find({}).zone();
            });
        });
    }

    /**
     * Get de array of 
     */
    get dataArray(): Element[] {
        return this._packageMedalService.bagPlanArray;
    }

    /**
    * This function changes de credit card payment method to select
    *@param {string} _paymentName
    */
    changeCcPaymentLogo(_paymentName: string) {
        this._paymentLogoName = 'images/' + _paymentName + '.png';
        this._ccMethodPayment = _paymentName;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
    * ngOnDestroy Implementation
    */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

}