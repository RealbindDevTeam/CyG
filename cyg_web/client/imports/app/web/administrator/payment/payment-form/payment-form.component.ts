import { Meteor } from 'meteor/meteor';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router, ActivatedRoute, Params } from '@angular/router';
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
import { EstablishmentPoint, Element } from '../../../../../../../both/models/points/establishment-point.model'
import { EstablishmentPoints } from '../../../../../../../both/collections/points/establishment-points.collection';
import { User } from '../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';
import { CcPaymentConfirmComponent } from './cc-payment-confirm/cc-payment-confirm.component';
import { PaymentTransaction } from '../../../../../../../both/models/payment/payment-transaction.model';
import { PaymentTransactions } from '../../../../../../../both/collections/payment/payment-transaction.collection';
import { TrnResponseConfirmComponent } from './transaction-response-confirm/trn-response-confirm.component';
import { PaymentsHistory } from '../../../../../../../both/collections/payment/payment-history.collection';
import { NegativePoints } from '../../../../../../../both/collections/points/negative-points.collection';
import { NegativePoint } from '../../../../../../../both/models/points/negative-point.model';

let md5 = require('md5');

@Component({
    selector: 'payment-form',
    templateUrl: './payment-form.component.html',
    styleUrls: ['./payment-form.component.scss']
})

export class PaymentFormComponent implements OnInit, OnDestroy {

    private _paymentLogoName: string = "";
    private _paymentForm: FormGroup;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _selectedPaymentMethod: string;
    private _ccMethodPayment: string;
    private _selectedCardMonth: string;
    private _monthsArray: any[];
    private _selectedCardYear: string;
    private _yearsArray: any[] = [];
    private _currentYear: number;
    private _currentDate: Date;
    private _user: User;
    private _userDetail: UserDetail;
    private _userDetailSub: Subscription;
    private _session_id: string;
    private _timestamp: string;
    private _deviceSessionId: string;
    private _is_prod_flag: string;
    private _isProd: boolean;
    private _cCPaymentMethodSub: Subscription;
    private _paymentTransactionSub: Subscription;
    private _countrySubscription: Subscription;
    private _parameterSub: Subscription;
    private _cCPaymentMethods: Observable<CcPaymentMethod[]>;
    private _countries: Observable<Country[]>;
    private _ipAddress: string = "";
    private _mdDialogRef: MatDialogRef<any>;
    private _mdDialogRef2: MatDialogRef<any>;
    private _titleMsg: string;
    private _btnAcceptLbl: string;
    private _loading: boolean;
    private _userAgent: string;
    private _urlForSecure: string;
    private _selectedCountry: Country;
    private _totalPrice: number = 0;
    private _totalCurrency: string;
    private _establishmentPointSub: Subscription;
    private _establishmentsArray: string[] = [];
    private _negativePointsSub: Subscription;

    /**
     * PaymentFormComponent Constructor
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
        private _userLanguageService: UserLanguageService,
        private _packageMedalService: PackageMedalService) {

        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

        this._currentDate = new Date();
        this._session_id = localStorage.getItem('Meteor.loginToken');
        this._timestamp = this._currentDate.getTime().toString();
        this._deviceSessionId = md5(this._session_id + this._timestamp);

        this._titleMsg = 'PAYMENT_FORM.SYSTEM_MSG';
        this._btnAcceptLbl = 'PAYMENT_FORM.ACCEPT';
    }

    /**
    * ngOnInit Implementation
    */
    ngOnInit() {
        this.removeSubscriptions();
        this._paymentForm = new FormGroup({
            paymentMethod: new FormControl('', [Validators.required]),
            payerName: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(150)]),
            cardNumber: new FormControl('', [Validators.required, Validators.minLength(13), Validators.maxLength(20), CustomValidators.numericValidator]),
            expirationMonth: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(2)]),
            expirationYear: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(4)]),
            securityCode: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(4), CustomValidators.numericValidator]),
            buyerName: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(150)]),
            dniNumber: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]),
            email: new FormControl('', [Validators.required, Validators.minLength(6), Validators.maxLength(255), CustomValidators.emailValidator]),
            streetOne: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]),
            contactPhone: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]),
            city: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)])
        });

        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._user = Users.findOne({ _id: Meteor.userId() });
                this._userDetail = UserDetails.findOne({ user_id: Meteor.userId() });

                this._paymentForm.get('buyerName').setValue(this._user.profile.full_name);
                this._paymentForm.get('buyerName').disable();
                this._paymentForm.get('dniNumber').setValue(this._userDetail.dni_number);
                this._paymentForm.get('email').setValue(this._user.emails[0].address);
                this._paymentForm.get('email').disable();
                let country: FormControl = new FormControl({ value: this._userDetail.country_id, disabled: false }, [Validators.required]);
                this._paymentForm.addControl('country', country);
                this._paymentForm.get('streetOne').setValue(this._userDetail.address);
                this._paymentForm.get('contactPhone').setValue(this._userDetail.contact_phone);
                this._paymentForm.get('city').setValue(this._userDetail.city_id);

                this._countrySubscription = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._countries = Countries.find({}).zone();
                        let auxCountry = Countries.findOne({ _id: this._userDetail.country_id });
                        this._selectedCountry = auxCountry;
                    });
                });
            });
        });

        this._cCPaymentMethodSub = MeteorObservable.subscribe('getCcPaymentMethods').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._cCPaymentMethods = CcPaymentMethods.find({}).zone();
            });
        });

        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _scriptOne: string = Parameters.findOne({ name: 'payu_script_tag' }).value;
                let _scriptThree: string = Parameters.findOne({ name: 'payu_script_code' }).value;

                this._is_prod_flag = Parameters.findOne({ name: 'payu_is_prod' }).value;
                this._isProd = (this._is_prod_flag == 'true');
                this._urlForSecure = _scriptOne + this._deviceSessionId + _scriptThree;

                this.loadScript(this._urlForSecure);

                let ipPublicUrl = Parameters.findOne({ name: 'ip_public_service_url' }).value;
                let ipPublicUrl2 = Parameters.findOne({ name: 'ip_public_service_url2' }).value;
                let ipPublicUrl3 = Parameters.findOne({ name: 'ip_public_service_url3' }).value;

                this._payuPaymentService.getPublicIp(ipPublicUrl).subscribe(
                    ipPublic => {
                        this._ipAddress = ipPublic.ip;
                    },
                    error => {
                        this._payuPaymentService.getPublicIp(ipPublicUrl2).subscribe(
                            ipPublic2 => {
                                this._ipAddress = ipPublic2.ip;
                            },
                            error => {
                                this._payuPaymentService.getPublicIp(ipPublicUrl3).subscribe(
                                    ipPublic3 => {
                                        this._ipAddress = ipPublic3.ip;
                                    },
                                    error => {
                                        let errorMsg = this.itemNameTraduction('PAYMENT_FORM.UNAVAILABLE_PAYMENT');
                                        this.openDialog(this._titleMsg, '', errorMsg, '', this._btnAcceptLbl, false);
                                        this._loading = false;
                                        this._router.navigate(['/app/bags-payment']);
                                    }
                                );
                            }
                        );
                    }
                );
            });
        });

        this._paymentTransactionSub = MeteorObservable.subscribe('getTransactions').takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentPointSub = MeteorObservable.subscribe('getEstablishmentPointsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe();

        this._monthsArray = [{ value: '01', viewValue: '01' }, { value: '02', viewValue: '02' }, { value: '03', viewValue: '03' },
        { value: '04', viewValue: '04' }, { value: '05', viewValue: '05' }, { value: '06', viewValue: '06' },
        { value: '07', viewValue: '07' }, { value: '08', viewValue: '08' }, { value: '09', viewValue: '09' },
        { value: '10', viewValue: '10' }, { value: '11', viewValue: '11' }, { value: '12', viewValue: '12' }];

        this._currentYear = this._currentDate.getFullYear();
        this._yearsArray.push({ value: this._currentYear, viewValue: this._currentYear });

        for (let i = 1; i <= 25; i++) {
            let auxYear = { value: this._currentYear + i, viewValue: this._currentYear + i };
            this._yearsArray.push(auxYear);
        }

        this.dataArray.forEach((establishment: Element) => {
            this._totalPrice = this._totalPrice + establishment.bagPlanPrice;
            if (establishment.creditPrice > 0) {
                this._totalPrice = this._totalPrice + establishment.creditPrice;
            }
            this._totalCurrency = establishment.bagPlanCurrency;

            this._establishmentsArray.push(establishment.establishmentId);
        });
        this._negativePointsSub = MeteorObservable.subscribe('getNegativePointsByEstablishmentsArray', this._establishmentsArray).takeUntil(this._ngUnsubscribe).subscribe();
        this._userAgent = navigator.userAgent;
    }

    /**
     * Load javascript for security
     */
    public loadScript(url: string) {
        var isFound = false;
        var scripts = document.getElementsByTagName("script");
        for (var i = 0; i < scripts.length; ++i) {
            if (scripts[i].getAttribute('src') != null && scripts[i].getAttribute('src').includes("loader")) {
                isFound = true;
            }
        }

        if (!isFound) {
            var dynamicScripts = [url];
            for (var i = 0; i < dynamicScripts.length; i++) {
                let nodeScript = document.createElement('script');
                nodeScript.src = dynamicScripts[i];
                nodeScript.type = 'text/javascript';
                document.getElementsByTagName('head')[0].appendChild(nodeScript);
                let nodeNoscript = document.createElement('noscript');
                document.getElementsByTagName('head')[0].appendChild(nodeNoscript);
                let nodeIframe = document.createElement('iframe');
                nodeIframe.src = dynamicScripts[i];
                nodeIframe.setAttribute('style', 'width: 100px; height: 100px; border: 0; position: absolute; top: -5000px;');
                document.getElementsByTagName('noscript')[0].appendChild(nodeIframe);
            }
        }
    }
    /**
     * Get de array of 
     */
    get dataArray(): Element[] {
        return this._packageMedalService.bagPlanArray;
    }

    /**
    * This function changes de country to select
    *@param {Country} _country
    */
    changeCountry(_country: Country) {
        this._selectedCountry = _country;
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
    * This function opens de dialog to confirm the payment
    */
    openConfirmDialog() {

        this._mdDialogRef = this._mdDialog.open(CcPaymentConfirmComponent, {
            disableClose: true,
            data: {
                ccfranchise: this._paymentLogoName,
                payername: this._paymentForm.value.payerName,
                cardnumber: this._paymentForm.value.cardNumber,
                buyername: Meteor.user().profile.full_name,
                country: this._selectedCountry.name,
                address: this._paymentForm.value.streetOne,
                telephone: this._paymentForm.value.contactPhone,
                establishmentarray: this.dataArray
            }
        });

        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                this._loading = true;
                setTimeout(() => {
                    this.getPayInfo();
                }, 5000);
            }
        });
    }

    /**
     * This function gets custPayInfo credentials
     */
    getPayInfo() {

        try {
            this.fillAuthorizationCaptureObject(this._payuPaymentService.al, this._payuPaymentService.ak, this._payuPaymentService.ai, this._payuPaymentService.mi);
        } catch (e) {
            let errorMsg = this.itemNameTraduction('PAYMENT_FORM.UNAVAILABLE_PAYMENT');
            this.openDialog(this._titleMsg, '', errorMsg, '', this._btnAcceptLbl, false);
            this._loading = false;
            this._router.navigate(['/app/bags-payment']);
        }
    }

    /**
     * This function fills the request object and sends to PayU Rest service
     */
    fillAuthorizationCaptureObject(al: string, ak: string, ai: number, mi: string) {

        let paymentTransactionF: PaymentTransaction;
        let paymentTransaction: PaymentTransaction;
        let prefixTrxParam: string = Parameters.findOne({ name: 'payu_reference_code' }).value;
        let buyerCountry: string;

        buyerCountry = Countries.findOne({ _id: this._selectedCountry._id }).alfaCode2;

        paymentTransactionF = PaymentTransactions.find({}, { sort: { count: -1 }, limit: 1 }).fetch()[0];

        if (paymentTransactionF) {
            PaymentTransactions.collection.insert({
                count: paymentTransactionF.count + 1,
                referenceCode: prefixTrxParam + (paymentTransactionF.count + 1),
                status: 'PREPARED',
                creation_date: new Date(),
                creation_user: Meteor.userId()
            });
        } else {
            PaymentTransactions.collection.insert({
                count: 1,
                referenceCode: prefixTrxParam + 1,
                status: 'PREPARED',
                creation_date: new Date(),
                creation_user: Meteor.userId()
            });
        }
        paymentTransaction = PaymentTransactions.collection.findOne({}, { sort: { count: -1 } });

        let ccardNameAux: string;
        let testAux: boolean = false;
        let payuPaymentsApiURI: string;

        if (this._isProd) {
            ccardNameAux = this._paymentForm.value.fullName;
            testAux = false;
            payuPaymentsApiURI = Parameters.findOne({ name: 'payu_payments_url_prod' }).value;
        } else {
            let testState: string = Parameters.findOne({ name: 'payu_test_state' }).value;
            ccardNameAux = testState;
            testAux = true;
            payuPaymentsApiURI = Parameters.findOne({ name: 'payu_payments_url_test' }).value;
        }

        //merchant
        let merchant: Merchant = {
            apiKey: ak,
            apiLogin: al
        };

        //buyer shipping address
        let buyerShippingAddress: ShippingBillingAddress = {
            street1: this._paymentForm.value.streetOne,
            city: this._paymentForm.value.city,
            country: buyerCountry
        }

        //buyer
        let buyer: Buyer = {
            merchantBuyerId: Meteor.userId(),
            fullName: this._user.profile.full_name,
            emailAddress: this._user.emails[0].address,
            contactPhone: this._paymentForm.value.contactPhone,
            dniNumber: this._paymentForm.value.dniNumber,
            shippingAddress: buyerShippingAddress
        }

        //tx_value
        let tx_value: TX_VALUE = {
            value: this._totalPrice,
            currency: this._totalCurrency
        }

        //tx_tax
        let tx_tax: TX_TAX = {
            value: 0,
            currency: this._totalCurrency
        }

        //tx_tax_return_base
        let tx_tax_return_base: TX_TAX_RETURN_BASE = {
            value: 0,
            currency: this._totalCurrency
        }

        //aditional values
        let additionalValues: AdditionalValues = {
            TX_VALUE: tx_value,
            TX_TAX: tx_tax,
            TX_TAX_RETURN_BASE: tx_tax_return_base
        }

        //extra parameters
        let extraParameters: ExtraParameters = {
            INSTALLMENTS_NUMBER: 1
        }

        //credit card

        let creditCard: CreditCard = {
            number: this._paymentForm.value.cardNumber,
            securityCode: this._paymentForm.value.securityCode,
            expirationDate: this._selectedCardYear + '/' + this._selectedCardMonth,
            name: ccardNameAux
        }

        //payer shipping address
        let payerShippingAddress: ShippingBillingAddress = {
            street1: this._paymentForm.value.streetOne,
            city: this._paymentForm.value.city,
            country: buyerCountry
        }

        //payer
        let payer: Payer = {
            fullName: this._paymentForm.value.payerName,
            emailAddress: this._user.emails[0].address,
            contactPhone: this._paymentForm.value.contactPhone,
            dniNumber: this._paymentForm.value.dniNumber,
            billingAddress: payerShippingAddress
        }

        //order
        let order: Order = {
            accountId: Number(ai),
            referenceCode: paymentTransaction.referenceCode,
            description: this.itemNameTraduction('PAYMENT_FORM.ORDER_DESCRIPTION'),
            language: Meteor.user().profile.language_code,
            signature: this.generateOrderSignature(ak, mi, paymentTransaction.referenceCode),
            additionalValues: additionalValues,
            buyer: buyer
        }

        //transaction
        let transaction: Transaction = {
            order: order,
            payer: payer,
            creditCard: creditCard,
            extraParameters: extraParameters,
            type: 'AUTHORIZATION_AND_CAPTURE',
            paymentMethod: this._selectedPaymentMethod,
            paymentCountry: 'CO',
            deviceSessionId: this._deviceSessionId,
            ipAddress: this._ipAddress,
            cookie: this._session_id,
            userAgent: this._userAgent
        }

        //cc request colombia
        let ccRequestColombia: CcRequestColombia = {
            language: Meteor.user().profile.language_code,
            command: 'SUBMIT_TRANSACTION',
            merchant: merchant,
            transaction: transaction,
            test: testAux
        }

        console.log(JSON.stringify(ccRequestColombia));

        this._payuPaymentService.authorizeAndCapture(payuPaymentsApiURI, ccRequestColombia).subscribe(
            response => {
                let transactionMessage: string;
                let transactionIcon: string;
                let showCancelBtn: boolean = false;

                console.log(JSON.stringify(response));
                if (response.code == 'ERROR') {
                    transactionMessage = 'PAYMENT_FORM.AUTH_ERROR_MSG';
                    transactionIcon = 'trn_declined.png';
                    showCancelBtn = true;
                } else if (response.code == 'SUCCESS') {
                    showCancelBtn = false;
                    switch (response.transactionResponse.state) {
                        case "APPROVED": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYMENT_FORM.TRANSACTION_APPROVED';
                            transactionIcon = 'trn_approved.png';
                            break;
                        }
                        case "DECLINED": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYMENT_FORM.TRANSACTION_DECLINED';
                            transactionIcon = 'trn_declined.png';
                            break;
                        }
                        case "PENDING": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYMENT_FORM.TRANSACTION_PENDING';
                            transactionIcon = 'trn_pending.png';
                            break;
                        }
                        case "EXPIRED": {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYMENT_FORM.TRANSACTION_EXPIRED';
                            transactionIcon = 'trn_declined.png';
                            break;
                        }
                        default: {
                            this.insertHistoryUpdateTransaction(response, paymentTransaction._id);
                            transactionMessage = 'PAYMENT_FORM.TRANSACTION_ERROR';
                            transactionIcon = 'trn_declined.png';
                            break;
                        }
                    }
                }
                this._loading = false;
                this._mdDialogRef2 = this._mdDialog.open(TrnResponseConfirmComponent, {
                    disableClose: true,
                    data: {
                        transactionResponse: transactionMessage,
                        transactionImage: transactionIcon,
                        showCancel: showCancelBtn
                    },
                });

                this._mdDialogRef2.afterClosed().subscribe(result => {
                    this._mdDialogRef2 = result;
                    if (result.success) {
                        this._router.navigate(['app/payment-history']);
                    }
                });
            },
            error => {
                let errorMsg = this.itemNameTraduction('PAYMENT_FORM.UNAVAILABLE_PAYMENT');
                this.openDialog(this._titleMsg, '', errorMsg, '', this._btnAcceptLbl, false);
                this._loading = false;
                this._router.navigate(['/app/bags-payment']);
            }
        );
    }

    /**
     * This function inserts the history Payment status and update the payment transaction 
     * @param {string} _status
     * */
    insertHistoryUpdateTransaction(_response: any, _transactionId: string) {
        PaymentTransactions.collection.update({ _id: _transactionId }, {
            $set: {
                status: _response.transactionResponse.state,
                responseCode: _response.transactionResponse.responseCode,
                responseMessage: _response.transactionResponse.responseMessage,
                responseOrderId: _response.transactionResponse.orderId,
                responsetransactionId: _response.transactionResponse.transactionId,
                modification_date: new Date(),
                modification_user: Meteor.userId()
            }
        });

        let transactionId = PaymentTransactions.collection.findOne({ _id: _transactionId })._id;

        let payment_history: string = PaymentsHistory.collection.insert({
            establishment_ids: this.dataArray,
            month: (this._currentDate.getMonth() + 1).toString(),
            year: (this._currentDate.getFullYear()).toString(),
            status: 'TRANSACTION_STATUS.' + _response.transactionResponse.state,
            paymentTransactionId: transactionId,
            paymentValue: Number(this._totalPrice),
            currency: this._totalCurrency,
            creation_date: new Date(),
            creation_user: Meteor.userId()
        });

        if (_response.transactionResponse.state == 'APPROVED') {

            this.dataArray.forEach((establishmentPaid) => {
                let establishmentPoint: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: establishmentPaid.establishmentId });
                let pointsToAdd: number = establishmentPaid.bagPlanPoints + establishmentPaid.creditPoints;

                EstablishmentPoints.update({ _id: establishmentPoint._id }, {
                    $set: {
                        current_points: establishmentPoint.current_points + pointsToAdd,
                        negative_balance: false,
                        negative_advice_counter: 0,
                        modification_user: Meteor.userId(),
                        modification_date: new Date()
                    }
                });

                NegativePoints.collection.find({ establishment_id: establishmentPaid.establishmentId, paid: false }).forEach(function <NegativePoint>(negativePoint, index, ar) {
                    NegativePoints.update({ _id: negativePoint._id }, {
                        $set: {
                            paid: true,
                            bag_plans_history_id: payment_history,
                            modification_user: Meteor.userId(),
                            modification_date: new Date()
                        }
                    });
                });
            });

            //Call meteor method for generate iurest invoice
            //MeteorObservable.call('generateInvoiceInfo', payment_history, Meteor.userId()).subscribe();
        }
    }

    /**
    * This function generates the order signature to fill request object
    * @param {string} _apikey
    * @param {string} _referenceCode
    * @return {string}
    */
    generateOrderSignature(_apikey: string, _merchantId: string, _referenceCode): string {
        let signatureEncoded: string = md5(_apikey + '~' + _merchantId + '~' + _referenceCode + '~' + this._totalPrice + '~' + this._totalCurrency);
        return signatureEncoded;
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     * @return {string}
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
    }

    /**
   * This function open de error dialog according to parameters 
   * @param {string} title
   * @param {string} subtitle
   * @param {string} content
   * @param {string} btnCancelLbl
   * @param {string} btnAcceptLbl
   * @param {boolean} showBtnCancel
   */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
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