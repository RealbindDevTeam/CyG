import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog, MatSnackBar } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Establishment, EstablishmentImage } from '../../../../../../../../both/models/establishment/establishment.model';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { PaymentMethod } from '../../../../../../../../both/models/general/paymentMethod.model';
import { PaymentMethods } from '../../../../../../../../both/collections/general/paymentMethod.collection';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Parameter } from '../../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../../both/collections/general/parameter.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../../../services/general/image.service';

@Component({
    selector: 'establishment-edition',
    templateUrl: './establishment-edition.component.html',
    styleUrls: ['./establishment-edition.component.scss']
})
export class EstablishmentEditionComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentToEdit: Establishment;
    private _establishmentEditionForm: FormGroup;
    private _paymentsFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _establishmentSub: Subscription;
    private _currencySub: Subscription;
    private _countriesSub: Subscription;
    private _paymentMethodsSub: Subscription;
    private _parameterSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _countries: Observable<Country[]>;
    private _currencies: Observable<Currency[]>;
    private _parameterDaysTrial: Observable<Parameter[]>;

    private _paymentMethods: PaymentMethod[] = [];
    private _paymentMethodsList: PaymentMethod[] = [];
    private _establishmentPaymentMethods: string[] = [];

    private _establishmentImageToEdit: EstablishmentImage;
    private _editImage: boolean = false;
    private _nameImageFileEdit: string = "";
    public _selectedIndex: number = 0;
    private _establishmentEditImageUrl: string;

    private _selectedCountryValue: string = "";
    private _establishmentCountryValue: string;

    private _establishmentCurrency: string = '';
    private _countryIndicative: string;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _loading: boolean = false;

    /**
     * EstablishmentEditionComponent Constructor
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {ActivatedRoute} _route 
     * @param {Router} _router 
     * @param {UserLanguageService} _userLanguageService
     * @param {ImageService} _imageService
     * @param {MatSnackBar} _snackBar
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _route: ActivatedRoute,
        private _router: Router,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _imageService: ImageService,
        private _snackBar: MatSnackBar) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._imageService.setPickOptionsLang(_lng);

        this._route.params.forEach((params: Params) => {
            this._establishmentToEdit = JSON.parse(params['param1']);
        });

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _establishmentImg: EstablishmentImage = Establishments.findOne({ _id: this._establishmentToEdit._id }).image;
                if (_establishmentImg) {
                    this._establishmentEditImageUrl = _establishmentImg.url;
                } else {
                    this._establishmentEditImageUrl = '/images/default-restaurant.png';
                }
            });
        });

        this._countriesSub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._countries = Countries.find({}).zone();
                let _lCountry: Country = Countries.findOne({ _id: this._establishmentToEdit.countryId });
            });
        });

        this._currencySub = MeteorObservable.subscribe('currencies').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let find: Currency = Currencies.findOne({ _id: this._establishmentToEdit.currencyId });
                this._establishmentCurrency = find.code + ' - ' + this.itemNameTraduction(find.name);
            });
        });

        this._paymentMethodsSub = MeteorObservable.subscribe('paymentMethods').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._paymentMethods = PaymentMethods.collection.find({}).fetch();
                for (let pay of this._paymentMethods) {
                    let paymentTranslated: PaymentMethod = {
                        _id: pay._id,
                        isActive: pay.isActive,
                        name: this.itemNameTraduction(pay.name)
                    };

                    let find = this._establishmentPaymentMethods.filter(p => p === paymentTranslated._id);

                    if (find.length > 0) {
                        let control: FormControl = new FormControl(true);
                        this._paymentsFormGroup.addControl(paymentTranslated.name, control);
                        this._paymentMethodsList.push(paymentTranslated);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._paymentsFormGroup.addControl(paymentTranslated.name, control);
                        this._paymentMethodsList.push(paymentTranslated);
                    }
                }
            });
        });

        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._parameterDaysTrial = Parameters.find({ _id: '100' });
        });

        this._establishmentEditionForm = new FormGroup({
            editId: new FormControl(this._establishmentToEdit._id),
            country: new FormControl(this._establishmentToEdit.countryId),
            city: new FormControl(this._establishmentToEdit.city),
            name: new FormControl(this._establishmentToEdit.name),
            address: new FormControl(this._establishmentToEdit.address),
            phone: new FormControl(this._establishmentToEdit.phone),
            editImage: new FormControl(''),
            paymentMethods: this._paymentsFormGroup
        });


        this._selectedCountryValue = this._establishmentToEdit.countryId;
        this._establishmentCountryValue = this._establishmentToEdit.countryId;
        this._establishmentPaymentMethods = this._establishmentToEdit.paymentMethods;
        this._countryIndicative = this._establishmentToEdit.indicative;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Funtion to edit establishment
     */
    editEstablishment(): void {
        if (!Meteor.userId()) {
            this.openDialog(this.titleMsg, '', 'LOGIN_SYSTEM_OPERATIONS_MSG', '', this.btnAcceptLbl, false);
            return;
        }

        this._loading = true;
        setTimeout(() => {
            let arrPay: any[] = Object.keys(this._establishmentEditionForm.value.paymentMethods);
            let _lPaymentMethodsToInsert: string[] = [];

            arrPay.forEach((pay) => {
                if (this._establishmentEditionForm.value.paymentMethods[pay]) {
                    let _lPayment: PaymentMethod = this._paymentMethodsList.filter(p => p.name === pay)[0];
                    _lPaymentMethodsToInsert.push(_lPayment._id);
                }
            });

            if (this._editImage) {
                Establishments.update(this._establishmentEditionForm.value.editId, {
                    $set: {
                        modification_user: Meteor.userId(),
                        modification_date: new Date(),
                        countryId: this._establishmentEditionForm.value.country,
                        city: this._establishmentEditionForm.value.city,
                        name: this._establishmentEditionForm.value.name,
                        address: this._establishmentEditionForm.value.address,
                        phone: this._establishmentEditionForm.value.phone,
                        paymentMethods: _lPaymentMethodsToInsert,
                        image: this._establishmentImageToEdit
                    }
                });
            } else {
                Establishments.update(this._establishmentEditionForm.value.editId, {
                    $set: {
                        modification_user: Meteor.userId(),
                        modification_date: new Date(),
                        countryId: this._establishmentEditionForm.value.country,
                        city: this._establishmentEditionForm.value.city,
                        name: this._establishmentEditionForm.value.name,
                        address: this._establishmentEditionForm.value.address,
                        phone: this._establishmentEditionForm.value.phone,
                        paymentMethods: _lPaymentMethodsToInsert,
                        points_validity: this._establishmentEditionForm.value.pointsValidity,
                        reward_points: this._establishmentEditionForm.value.rewardValue
                    }
                });
            }
            let _lMessage: string = this.itemNameTraduction('RESTAURANT_EDITION.RESTAURANT_EDITED');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
            this.cancel();
        }, 2500);
    }

    /**
     * Function to cancel edition
     */
    cancel(): void {
        this._router.navigate(['app/establishment']);
    }

    /**
     * Function to change country
     * @param {string} _country
     */
    changeCountry(_country) {
        this._selectedCountryValue = _country;
        this._establishmentEditionForm.controls['country'].setValue(_country);

        let _lCountry: Country;
        Countries.find({ _id: _country }).fetch().forEach((c) => {
            _lCountry = c;
        });
        let _lCurrency: Currency;
        Currencies.find({ _id: _lCountry.currencyId }).fetch().forEach((cu) => {
            _lCurrency = cu;
        });
        this._establishmentCurrency = _lCurrency.code + ' - ' + this.itemNameTraduction(_lCurrency.name);
        this._countryIndicative = _lCountry.indicative;
    }
    
    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFileEdit = _imageToUpload.filename;
            this._establishmentImageToEdit = _imageToUpload;
            this._editImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
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
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}