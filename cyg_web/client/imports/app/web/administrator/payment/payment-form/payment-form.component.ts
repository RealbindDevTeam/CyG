import { Meteor } from 'meteor/meteor';
import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { User } from '../../../../../../../both/models/auth/user.model';
import { Users } from '../../../../../../../both/collections/auth/user.collection';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';

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
    private _billingForm: FormGroup;
    private _session_id: string;
    private _timestamp: string;
    private _deviceSessionId: string;
    private _is_prod_flag: string;
    private _isProd: boolean;
    private _cCPaymentMethodSub: Subscription;
    private _countrySubscription: Subscription;
    private _parameterSub: Subscription;
    private _cCPaymentMethods: Observable<CcPaymentMethod[]>;
    private _countries: Observable<Country[]>;
    private _parameters: Observable<Parameter[]>;
    private _loadJS: Promise<any>;
    private _ipAddress: string = "";
    private _mdDialogRef: MatDialogRef<any>;
    private _titleMsg: string;
    private _btnAcceptLbl: string;
    private _loading: boolean;
    private _userAgent: string;
    private _countryName: string;
    private _urlForSecure: string;

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
        private _domSanitizer: DomSanitizer,
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
            contactPhone: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(20)])
        });
        this._countrySubscription = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._countries = Countries.find({}).zone();
            });
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
                this._loadJS = new Promise((resolve) => {
                    this.loadScript(this._urlForSecure);
                    resolve(true);
                });

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
            console.log('entró');
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
        //this._cities = Cities.find({ country: _country._id }).zone();
        this._countryName = _country.name;
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
        console.log('ENTRA A MÉTODO DE ENVÍO DE OBJETO PAYU');
        
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