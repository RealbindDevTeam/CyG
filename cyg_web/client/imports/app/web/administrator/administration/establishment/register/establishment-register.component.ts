import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MatDialog, MatSnackBar } from '@angular/material';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Establishment, EstablishmentImage } from '../../../../../../../../both/models/establishment/establishment.model';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { PaymentMethod } from '../../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../../both/collections/general/paymentMethod.collection';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { createEstablishmentCode, generateQRCode, createTableCode, createCodeToEstablishmentQR } from '../../../../../../../../both/methods/establishment/establishment.methods';
import { CreateConfirmComponent } from './create-confirm/create-confirm.component';
import { Table } from '../../../../../../../../both/models/establishment/table.model';
import { Tables } from '../../../../../../../../both/collections/establishment/table.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../../../services/general/image.service';
import { AfterEstablishmentCreationComponent } from './after-establishment-creation/after-establishment-creation.component';
import { Parameter } from '../../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../../both/collections/general/parameter.collection';
import { EstablishmentPoint } from '../../../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../../../both/collections/points/establishment-points.collection';
import { BagPlan } from '../../../../../../../../both/models/points/bag-plan.model';
import { BagPlans } from '../../../../../../../../both/collections/points/bag-plans.collection';
import { BagPlanHistory, BagPlansPoints } from '../../../../../../../../both/models/points/bag-plan-history.model';
import { BagPlanHistories } from '../../../../../../../../both/collections/points/bag-plans-history.collection';
import { PricePoints } from '../../../../../../../../both/models/points/bag-plan.model';
import * as QRious from 'qrious';
import { UserDetails } from 'both/collections/auth/user-detail.collection';
import { EstablishmentQR } from '../../../../../../../../both/models/establishment/establishment-qr.model';
import { EstablishmentQRs } from '../../../../../../../../both/collections/establishment/establishment-qr.collection';

@Component({
    selector: 'establishment-register',
    templateUrl: './establishment-register.component.html',
    styleUrls: ['./establishment-register.component.scss']
})
export class EstablishmentRegisterComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentForm: FormGroup;
    private _paymentsFormGroup: FormGroup = new FormGroup({});

    private _establishmentSub: Subscription;
    private _establishmentQRSub: Subscription;
    private _currencySub: Subscription;
    private _countriesSub: Subscription;
    private _paymentMethodsSub: Subscription;
    private _usrDetailSubscription: Subscription;
    private _parameterSubscription: Subscription;
    private _bagPlansSubscription: Subscription;
    private _bagPlanHistorySubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _countries: Observable<Country[]>;
    private _paymentMethods: Observable<PaymentMethod[]>;

    private _establishmentImageToInsert: EstablishmentImage;
    private _createImage: boolean;
    private _nameImageFile: string;
    public _selectedIndex: number = 0;
    private _selectedCountryValue: string;
    private _establishmentCurrency: string = '';
    private _countryIndicative: string;
    private _establishmentCurrencyId: string = '';
    private establishmentCode: string = '';

    private _loading: boolean;
    private _mdDialogRef: MatDialogRef<any>;
    private _currentDate: Date;
    private _firstMonthDay: Date;
    private _lastMonthDay: Date;
    private titleMsg: string;
    private btnAcceptLbl: string;

    private showRestCreation: boolean;
    private validatePaymentMethod: boolean = false;

    /**
     * EstablishmentRegisterComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {Router} _router
     * @param {MatDialog} _mdDialog
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        public _mdDialog: MatDialog,
        private _userLanguageService: UserLanguageService,
        private _imageService: ImageService,
        private _snackBar: MatSnackBar) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._imageService.setPickOptionsLang(_lng);
        this._selectedCountryValue = "";
        this._nameImageFile = "";
        this._createImage = false;
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentForm = new FormGroup({
            country: new FormControl('', [Validators.required]),
            city: new FormControl('', [Validators.required]),
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]),
            address: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(40)]),
            phone: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(20)]),
            image: new FormControl(''),
            paymentMethods: this._paymentsFormGroup
        });

        this._paymentMethodsSub = MeteorObservable.subscribe('paymentMethods').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._paymentMethods = PaymentMethods.find({}).zone();
                this._paymentMethods.subscribe(() => { this.createPaymentMethods() });
            });
        });

        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentQRSub = MeteorObservable.subscribe('getEstablishmentQRsByAdmin', this._user).takeUntil(this._ngUnsubscribe).subscribe();
        this._countriesSub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._countries = Countries.find({}).zone();
            });
        });
        this._currencySub = MeteorObservable.subscribe('currencies').takeUntil(this._ngUnsubscribe).subscribe();
        this._parameterSubscription = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe();
        this._bagPlansSubscription = MeteorObservable.subscribe('getBagPlans').takeUntil(this._ngUnsubscribe).subscribe();
        this._currentDate = new Date();
        this._firstMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth(), 1);
        this._lastMonthDay = new Date(this._currentDate.getFullYear(), this._currentDate.getMonth() + 1, 0);

        this._usrDetailSubscription = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            let _lUsrDetail = UserDetails.findOne({ user_id: this._user });
            if (_lUsrDetail) {
                this.showRestCreation = _lUsrDetail.show_after_rest_creation;
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
     * Function to cancel add Establishment 
     */
    cancel(): void {
        if (this._selectedCountryValue !== "") { this._selectedCountryValue = ""; }
        this._establishmentForm.controls['paymentMethods'].reset();
        this._establishmentForm.controls['name'].reset();
        this._establishmentForm.controls['address'].reset();
        this._establishmentForm.controls['phone'].reset();
        this._router.navigate(['app/establishment']);
    }

    /**
     * Create Payment Methods
     */
    createPaymentMethods(): void {
        PaymentMethods.collection.find({}).fetch().forEach((pay) => {
            if (this._paymentsFormGroup.contains(pay._id)) {
                this._paymentsFormGroup.controls[pay._id].setValue(false);
            } else {
                let control: FormControl = new FormControl(false);
                this._paymentsFormGroup.addControl(pay._id, control);
            }
        });
    }

    /**
     * Function to add Establishment
     */
    addEstablishment(): void {
        if (!this._user) {
            this.openDialog(this.titleMsg, '', 'LOGIN_SYSTEM_OPERATIONS_MSG', '', this.btnAcceptLbl, false);
            return;
        }

        this._mdDialogRef = this._mdDialog.open(CreateConfirmComponent, {
            disableClose: true
        });

        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {
                this._loading = true;
                setTimeout(() => {
                    this.createNewEstablishment().then((establishment_id) => {
                        this._loading = false;
                        let _lMessage: string = this.itemNameTraduction('RESTAURANT_REGISTER.RESTAURANT_CREATED');
                        this._snackBar.open(_lMessage, '', { duration: 2500 });
                        this._router.navigate(['app/establishment']);
                    }).catch((err) => {
                        this._loading = false;
                        var error: string = this.itemNameTraduction('RESTAURANT_REGISTER.CREATION_ERROR');
                        this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                        this._router.navigate(['app/establishment']);
                    });
                }, 3500);
            }
        });
    }

    /**
     * Promise to create new establishment
     */
    createNewEstablishment(): Promise<string> {
        let _lNewEstablishment: string;
        let _lNewEstablishmentPoint: string;
        return new Promise((resolve, reject) => {
            try {
                let arrPay: any[] = Object.keys(this._establishmentForm.value.paymentMethods);
                let _lPaymentMethodsToInsert: string[] = [];

                arrPay.forEach((pay) => {
                    if (this._establishmentForm.value.paymentMethods[pay]) {
                        _lPaymentMethodsToInsert.push(pay);
                    }
                });

                if (this._createImage) {
                    _lNewEstablishment = Establishments.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        countryId: this._establishmentForm.value.country,
                        city: this._establishmentForm.value.city,
                        name: this._establishmentForm.value.name,
                        currencyId: this._establishmentCurrencyId,
                        address: this._establishmentForm.value.address,
                        indicative: this._countryIndicative,
                        phone: this._establishmentForm.value.phone,
                        establishment_code: this.generateEstablishmentCode(),
                        paymentMethods: _lPaymentMethodsToInsert,
                        image: this._establishmentImageToInsert,
                        tables_quantity: 0,
                        isActive: true,
                        firstPay: true,
                        freeDays: true,
                        is_beta_tester: false,
                        bag_plans_id: "100",
                        is_freemium: false,
                    });
                } else {
                    _lNewEstablishment = Establishments.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        countryId: this._establishmentForm.value.country,
                        city: this._establishmentForm.value.city,
                        name: this._establishmentForm.value.name,
                        currencyId: this._establishmentCurrencyId,
                        address: this._establishmentForm.value.address,
                        indicative: this._countryIndicative,
                        phone: this._establishmentForm.value.phone,
                        establishment_code: this.generateEstablishmentCode(),
                        paymentMethods: _lPaymentMethodsToInsert,
                        tables_quantity: 0,
                        isActive: true,
                        firstPay: true,
                        freeDays: true,
                        is_beta_tester: false,
                        bag_plans_id: "100",
                        is_freemium: false,
                    });
                }
                //Insert establishment points
                let _lEstabl: Establishment = Establishments.findOne({ _id: _lNewEstablishment });
                let _lBagPlan: BagPlan = BagPlans.findOne({ _id: "100", 'price.country_id': _lEstabl.countryId });

                _lNewEstablishmentPoint = EstablishmentPoints.collection.insert({
                    establishment_id: _lNewEstablishment,
                    current_points: _lBagPlan.value_points,
                    negative_balance: false,
                    negative_advice_counter: 0,
                    creation_user: this._user,
                    creation_date: new Date()
                });

                let pricePoints: BagPlansPoints;

                _lBagPlan.price.forEach((priceObj) => {
                    if (priceObj.country_id === _lEstabl.countryId) {
                        pricePoints = {
                            country_id: priceObj.country_id,
                            price: priceObj.price,
                            currency: priceObj.currency
                        };
                    }
                });

                //insert first history document for establishment in history
                BagPlanHistories.collection.insert({
                    plan_name: _lBagPlan.name,
                    plan_label: _lBagPlan.label,
                    value_points: _lBagPlan.value_points,
                    price: pricePoints,
                    establishment_id: _lNewEstablishment,
                    creation_user: this._user,
                    creation_date: new Date()
                });

                //Insert tables
                let _lParameterUrl: Parameter = Parameters.collection.findOne({ _id: "50000" });

                this.establishmentCode = _lEstabl.establishment_code;
                let _lUrl: string = _lParameterUrl.value;

                let _lEstablishmentQRCode: string = this.generateEstablishmentQRCode();
                let _lCodeGenerator = generateQRCode(_lEstablishmentQRCode);
                let _lUriRedirect: string = _lUrl + '\0' + '/qr?' + _lCodeGenerator.getQRCode();

                let _lQrCode = new QRious({
                    background: 'white',
                    backgroundAlpha: 1.0,
                    foreground: 'black',
                    foregroundAlpha: 1.0,
                    level: 'M',
                    mime: 'image/svg',
                    padding: null,
                    size: 150,
                    value: _lUriRedirect
                });

                EstablishmentQRs.insert({
                    creation_user: this._user,
                    creation_date: new Date(),
                    is_active: true,
                    establishment_id: _lNewEstablishment,
                    establishment_qr_code: _lEstablishmentQRCode,
                    QR_code: _lCodeGenerator.getQRCode(),
                    QR_information: {
                        significativeBits: _lCodeGenerator.getSignificativeBits(),
                        bytes: _lCodeGenerator.getFinalBytes()
                    },
                    QR_URI: _lQrCode.toDataURL(),
                    uri_redirect: _lUriRedirect,
                    reward_points: 1
                });

                let _lCurrency: Currency;
                Currencies.find({ _id: _lEstabl.currencyId }).fetch().forEach((cu) => {
                    _lCurrency = cu;
                });

                resolve(_lNewEstablishment);
                if (this.showRestCreation) {
                    this.openDialogAfterRestaurantRegister();
                }
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Show AfterEstablishmentCreationComponent dialog
     */
    openDialogAfterRestaurantRegister() {
        this._mdDialogRef = this._mdDialog.open(AfterEstablishmentCreationComponent);
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this._translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
    }

    /**
     * Function to change country
     * @param {string} _country
     */
    changeCountry(_country) {
        this._selectedCountryValue = _country;
        this._establishmentForm.controls['country'].setValue(_country);

        let _lCountry: Country;
        Countries.find({ _id: _country }).fetch().forEach((c) => {
            _lCountry = c;
        });
        let _lCurrency: Currency;
        Currencies.find({ _id: _lCountry.currencyId }).fetch().forEach((cu) => {
            _lCurrency = cu;
        });
        this._establishmentCurrencyId = _lCurrency._id;
        this._establishmentCurrency = _lCurrency.code + ' - ' + this.itemNameTraduction(_lCurrency.name);
        this._countryIndicative = _lCountry.indicative;
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFile = _imageToUpload.filename;
            this._establishmentImageToInsert = _imageToUpload;
            this._createImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
    }

    /**
     * Function to validate establishment payment methods
     */
    changePaymentMethod(isChecked: boolean) {
        if (isChecked) {
            this.validatePaymentMethod = true;
        } else {
            this.validatePaymentMethod = false;
        }
    }

    /**
     * Function to generate Establishment code
     */
    generateEstablishmentCode(): string {
        let _lCode: string = '';

        while (true) {
            _lCode = createEstablishmentCode();
            if (Establishments.find({ establishment_code: _lCode }).cursor.count() === 0) {
                break;
            }
        }
        return _lCode;
    }

    /**
     * Function to generate Establishment QR code
     */
    generateEstablishmentQRCode(): string {
        let _lCode: string = '';
        while (true) {
            _lCode = createCodeToEstablishmentQR();
            if (EstablishmentQRs.find({ establishment_qr_code: _lCode }).cursor.count() === 0) {
                break;
            }
        }
        return _lCode;
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
     * Implements ngOnDestroy function
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}
