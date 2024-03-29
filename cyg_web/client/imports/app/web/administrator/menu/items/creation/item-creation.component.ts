import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog, MatSnackBar, MatStepper } from '@angular/material';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { ItemEstablishment, ItemPrice, ItemImage } from '../../../../../../../../both/models/menu/item.model';
import { Items } from '../../../../../../../../both/collections/menu/item.collection';
import { Sections } from '../../../../../../../../both/collections/menu/section.collection';
import { Section } from '../../../../../../../../both/models/menu/section.model';
import { Categories } from '../../../../../../../../both/collections/menu/category.collection';
import { Category } from '../../../../../../../../both/models/menu/category.model';
import { Subcategory } from '../../../../../../../../both/models/menu/subcategory.model';
import { Subcategories } from '../../../../../../../../both/collections/menu/subcategory.collection';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Currency } from '../../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../../both/collections/general/currency.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { AlertConfirmComponent } from '../../../../../web/general/alert-confirm/alert-confirm.component';
import { ImageService } from '../../../../services/general/image.service';

@Component({
    selector: 'item-creation',
    templateUrl: './item-creation.component.html',
    styleUrls: ['./item-creation.component.scss']
})

export class ItemCreationComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _sectionsFormGroup: FormGroup;
    private _generalFormGroup: FormGroup;

    private _establishmentsFormGroup: FormGroup = new FormGroup({});
    private _currenciesFormGroup: FormGroup = new FormGroup({});
    private _taxesFormGroup: FormGroup = new FormGroup({});
    private _mdDialogRef: MatDialogRef<any>;

    private _sections: Observable<Section[]>;
    private _categories: Observable<Category[]>;
    private _subcategories: Observable<Subcategory[]>;
    private _currencies: Observable<Currency[]>;

    private _itemsSub: Subscription;
    private _sectionsSub: Subscription;
    private _categorySub: Subscription;
    private _subcategorySub: Subscription;
    private _establishmentSub: Subscription;
    private _currenciesSub: Subscription;
    private _countriesSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishmentList: Establishment[] = [];
    private _establishmentCurrencies: string[] = [];
    private _establishmentTaxes: string[] = [];

    private _createImage: boolean = false;
    private _showAdditions: boolean = false;
    private _showEstablishments: boolean = false;
    private _showCurrencies: boolean = false;
    private _showTaxes: boolean = false;
    private _loading: boolean = false;
    private _showOptions: boolean = false;
    private _showGeneralError: boolean = false;

    public _selectedIndex: number = 0;
    private _itemImageToInsert: ItemImage;
    private _nameImageFile: string;
    private _establishmentsSelectedCount: number = 0;

    private _selectedSectionValue: string;
    private _selectedCategoryValue: string;
    private _selectedSubcategoryValue: string;
    private titleMsg: string;
    private btnAcceptLbl: string;

    //private _rewardEnable: boolean = false;

    /**
     * ItemComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {Router} _router
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _imageService: ImageService,
        private _snackBar: MatSnackBar) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');
        this._imageService.setPickOptionsLang(_lng);
        this._selectedSectionValue = "";
        this._selectedCategoryValue = "";
        this._selectedSubcategoryValue = "";
        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * Implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        let _establishmentsId: string[] = [];
        let _currenciesIds: string[] = [];
        let _optionIds: string[] = [];

        this._sectionsFormGroup = new FormGroup({
            section: new FormControl('', [Validators.required]),
            category: new FormControl(''),
            subcategory: new FormControl('')
        });

        this._generalFormGroup = new FormGroup({
            name: new FormControl('', [Validators.required, Validators.minLength(1), Validators.maxLength(55)]),
            description: new FormControl(''),
            image: new FormControl(''),
            establishments: this._establishmentsFormGroup,
            currencies: this._currenciesFormGroup,
            taxes: this._taxesFormGroup
        });

        this._sectionsSub = MeteorObservable.subscribe('sections', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._sections = Sections.find({ creation_user: this._user, is_active: true }).zone();
            });
        });

        this._categorySub = MeteorObservable.subscribe('categories', this._user).takeUntil(this._ngUnsubscribe).subscribe();
        this._subcategorySub = MeteorObservable.subscribe('subcategories', this._user).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                Establishments.collection.find({ creation_user: this._user }).fetch().forEach((res) => {
                    _establishmentsId.push(res._id);
                    _currenciesIds.push(res.currencyId);
                });
                this._countriesSub = MeteorObservable.subscribe('getCountriesByEstablishmentsId', _establishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
                this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', _establishmentsId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._currencies = Currencies.find({ _id: { $in: _currenciesIds } }).zone();
                    });
                });
            });
        });
        this._itemsSub = MeteorObservable.subscribe('items', this._user).takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This function allow move in wizard tabs
     * @param {number} _index
     */
    canMove(_index: number): boolean {
        switch (_index) {
            case 0:
                if (this._sectionsFormGroup.controls['section'].valid) {
                    return true;
                } else {
                    return false;
                }
            case 1:
                if (this._generalFormGroup.controls['name'].valid && this._establishmentsSelectedCount > 0) {
                    this._showGeneralError = false;
                    return true
                } else {
                    this._showGeneralError = true;
                    return false;
                }
            case 2:
                return true;
            default:
                return true;
        }
    }

    /**
     * Function to go back in the stepper
     * @param {MatStepper} _stepper 
     */
    goBack(_stepper: MatStepper) {
        _stepper.previous();
    }

    /**
     * Function to go forward in the stepper
     * @param {MatStepper} _stepper 
     */
    goForward(_stepper: MatStepper) {
        if (this.canMove(_stepper.selectedIndex)) {
            _stepper.next();
        }
    }

    /**
     * Function to add Item
     */
    addItem(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        this._loading = true;
        setTimeout(() => {
            this.createNewItem().then((item_id) => {
                this._loading = false;
                let _lMessage: string = this.itemNameTraduction('ITEMS.ITEM_CREATED');
                this._snackBar.open(_lMessage, '', { duration: 2500 });
                this._router.navigate(['app/items']);
            }).catch((err) => {
                this.cancel();
                this._loading = false;
                this._router.navigate(['app/items']);
                var error: string = this.itemNameTraduction('ITEMS.CREATION_ERROR');
                this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            });
        }, 3500);
    }

    /**
     * Promise to create new item
     */
    createNewItem(): Promise<string> {
        let _lNewItem: string;

        return new Promise((resolve, reject) => {
            try {
                let arrCur: any[] = Object.keys(this._generalFormGroup.value.currencies);
                let _lItemEstablishmentsToInsert: ItemEstablishment[] = [];
                let _lItemPricesToInsert: ItemPrice[] = [];

                arrCur.forEach((cur) => {
                    let find: Establishment[] = this._establishmentList.filter(r => r.currencyId === cur);
                    for (let es of find) {
                        if (this._generalFormGroup.value.establishments[es._id]) {
                            let _lItemEstablishment: ItemEstablishment = { establishment_id: '', price: 0, isAvailable: true, recommended: false };

                            _lItemEstablishment.establishment_id = es._id;
                            _lItemEstablishment.price = this._generalFormGroup.value.currencies[cur];

                            if (this._generalFormGroup.value.taxes[cur] !== undefined) {
                                _lItemEstablishment.itemTax = this._generalFormGroup.value.taxes[cur];
                            }

                            _lItemEstablishmentsToInsert.push(_lItemEstablishment);
                        }
                    }
                    if (cur !== null && this._generalFormGroup.value.currencies[cur] !== null) {
                        let _lItemPrice: ItemPrice = { currencyId: '', price: 0 };
                        _lItemPrice.currencyId = cur;
                        _lItemPrice.price = this._generalFormGroup.value.currencies[cur];
                        if (this._generalFormGroup.value.taxes[cur] !== undefined) {
                            _lItemPrice.itemTax = this._generalFormGroup.value.taxes[cur];
                        }
                        _lItemPricesToInsert.push(_lItemPrice);
                    }
                });

                if (this._createImage) {
                    _lNewItem = Items.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        is_active: true,
                        sectionId: this._sectionsFormGroup.value.section,
                        categoryId: this._sectionsFormGroup.value.category,
                        subcategoryId: this._sectionsFormGroup.value.subcategory,
                        name: this._generalFormGroup.value.name,
                        description: this._generalFormGroup.value.description,
                        establishments: _lItemEstablishmentsToInsert,
                        prices: _lItemPricesToInsert,
                        image: this._itemImageToInsert
                    });
                } else {
                    _lNewItem = Items.collection.insert({
                        creation_user: this._user,
                        creation_date: new Date(),
                        modification_user: '-',
                        modification_date: new Date(),
                        is_active: true,
                        sectionId: this._sectionsFormGroup.value.section,
                        categoryId: this._sectionsFormGroup.value.category,
                        subcategoryId: this._sectionsFormGroup.value.subcategory,
                        name: this._generalFormGroup.value.name,
                        description: this._generalFormGroup.value.description,
                        establishments: _lItemEstablishmentsToInsert,
                        prices: _lItemPricesToInsert
                    });
                }
                resolve(_lNewItem);
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Function to change Section
     * @param {string} _section
     */
    changeSection(_section): void {
        let _establishmentSectionsIds: string[] = [];
        this._establishmentList = [];
        this._selectedSectionValue = _section;
        this._sectionsFormGroup.controls['section'].setValue(_section);

        this._categories = Categories.find({ section: _section, is_active: true }).zone();
        if (this._categories.isEmpty) { this._selectedCategoryValue = ""; }
        if (this._subcategories) {
            if (this._subcategories.isEmpty) { this._selectedSubcategoryValue = ""; }
        }

        let _lSection: Section = Sections.findOne({ _id: _section });

        if (Establishments.collection.find({ _id: { $in: _lSection.establishments } }).count() > 0) {
            this._showEstablishments = true;
            Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {
                let control: FormControl = new FormControl(false);
                this._establishmentsFormGroup.addControl(r._id, control);
                _establishmentSectionsIds.push(r._id);
                this._establishmentList.push(r);
            });
        }
    }

    /**
     * This function allow create item price with diferent currencies
     * @param {string} _pEstablishmentName 
     * @param {any} _pEvent 
     */
    onCheckEstablishment(_pEstablishmentName: string, _pEvent: any): void {
        let _lEstablishment: Establishment = this._establishmentList.find(r => r.name === _pEstablishmentName);
        if (_pEvent.checked) {
            this._showGeneralError = false;
            this._establishmentsSelectedCount++;
            let _lCountry: Country = Countries.findOne({ _id: _lEstablishment.countryId });
            if (this._establishmentCurrencies.indexOf(_lEstablishment.currencyId) <= -1) {
                let control: FormControl = new FormControl('', [Validators.required]);
                this._currenciesFormGroup.addControl(_lEstablishment.currencyId, control);
                this._establishmentCurrencies.push(_lEstablishment.currencyId);

                if (_lCountry.itemsWithDifferentTax === true) {
                    let control: FormControl = new FormControl('0', [Validators.required]);
                    this._taxesFormGroup.addControl(_lEstablishment.currencyId, control);
                    this._establishmentTaxes.push(_lEstablishment.currencyId);
                }
            }
        } else {
            this._establishmentsSelectedCount--;
            let _aux: number = 0;
            let _auxTax: number = 0;
            let arr: any[] = Object.keys(this._generalFormGroup.value.establishments);
            arr.forEach((est) => {
                if (this._generalFormGroup.value.establishments[est]) {
                    let _lRes: Establishment = this._establishmentList.find(r => r.name === est);
                    if (_lEstablishment.currencyId === _lRes.currencyId) {
                        _aux++;
                    }
                    let _lCountry: Country = Countries.findOne({ _id: _lRes.countryId });
                    if (_lCountry.itemsWithDifferentTax === true) {
                        _auxTax++;
                    }
                }
            });

            if (_aux === 0) { this._establishmentCurrencies.splice(this._establishmentCurrencies.indexOf(_lEstablishment.currencyId), 1); }
            if (_auxTax === 0) { this._establishmentTaxes.splice(this._establishmentTaxes.indexOf(_lEstablishment.currencyId), 1); }
        }
        this._establishmentCurrencies.length > 0 ? this._showCurrencies = true : this._showCurrencies = false;
        this._establishmentTaxes.length > 0 ? this._showTaxes = true : this._showTaxes = false;
    }

    /**
     * Function to change category
     * @param {string} _category
     */
    changeCategory(_category): void {
        this._selectedCategoryValue = _category;
        this._sectionsFormGroup.controls['category'].setValue(_category);
        this._subcategories = Subcategories.find({ category: _category, is_active: true }).zone();

        if (this._subcategories.isEmpty) { this._selectedSubcategoryValue = ""; }
    }

    /**
     * Function to change subcategory
     * @param {string} _subcategory
     */
    changeSubcategory(_subcategory): void {
        this._selectedSubcategoryValue = _subcategory;
        this._sectionsFormGroup.controls['subcategory'].setValue(_subcategory);
    }

    /**
     * Function to cancel add Item
     */
    cancel(): void {
        if (this._selectedSectionValue !== "") { this._selectedSectionValue = ""; }
        if (this._selectedCategoryValue !== "") { this._selectedCategoryValue = ""; }
        if (this._selectedSubcategoryValue !== "") { this._selectedSubcategoryValue = ""; }
        this._createImage = false;
        this._sectionsFormGroup.reset();
        this._generalFormGroup.reset();
        this._router.navigate(['app/items']);
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFile = _imageToUpload.filename;
            this._itemImageToInsert = _imageToUpload;
            this._createImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
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
     * This function allow translate
     * @param itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * Implements ngOnDestroy function
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}