import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { MatSnackBar, MatStepper } from '@angular/material';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Item, ItemImage, ItemEstablishment, ItemPrice } from '../../../../../../../../both/models/menu/item.model';
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
    selector: 'item-edition',
    templateUrl: './item-edition.component.html',
    styleUrls: ['./item-edition.component.scss']
})
export class ItemEditionComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    public _itemToEdit: Item;
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
    private _establishmentSub: Subscription;
    private _sectionsSub: Subscription;
    private _categorySub: Subscription;
    private _subcategorySub: Subscription;
    private _currenciesSub: Subscription;
    private _countriesSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    public _selectedIndex: number = 0;
    private _showEstablishments: boolean = false;
    private _showCurrencies: boolean = false;
    private _showTaxes: boolean = false;
    private _showGeneralError: boolean = false;
    private _loading: boolean = false;

    private _itemSection: string;
    private _itemCategory: string;
    private _itemSubcategory: string;
    private _selectedCategory: string = "";
    private _selectedSection: string = "";
    private _selectedSubcategory: string = "";

    private _establishmentList: Establishment[] = [];
    private _itemEstablishments: ItemEstablishment[] = [];
    private _establishmentCurrencies: string[] = [];
    private _establishmentTaxes: string[] = [];

    private _editImage: boolean = false;
    private _editItemImageToInsert: ItemImage;
    private _nameImageFileEdit: string;
    private _itemEditImageUrl: string;
    private _establishmentsSelectedCount: number = 0;
    private titleMsg: string;
    private btnAcceptLbl: string;

    /**
     * ItemEditionComponent constructor
     * @param {FormBuilder} _formBuilder
     * @param {TranslateService} _translate
     * @param {NgZone} _ngZone
     * @param {MatSnackBar} snackBar
     * @param {UserLanguageService} _userLanguageService
     */
    constructor(private _router: Router,
        private _route: ActivatedRoute,
        private _formBuilder: FormBuilder,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        public snackBar: MatSnackBar,
        private _userLanguageService: UserLanguageService,
        protected _mdDialog: MatDialog,
        private _imageService: ImageService) {
        let _lng: string = this._userLanguageService.getLanguage(Meteor.user());
        _translate.use(_lng);
        _translate.setDefaultLang('en');

        this._route.params.forEach((params: Params) => {
            this._itemToEdit = JSON.parse(params['param1']);
        });

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * implements ngOnInit function
     */
    ngOnInit() {
        this.removeSubscriptions();
        let _establishmentsId: string[] = [];
        let _currenciesId: string[] = [];
        let _optionIds: string[] = [];

        this._sectionsFormGroup = new FormGroup({
            editId: new FormControl(this._itemToEdit._id),
            editIsActive: new FormControl(this._itemToEdit.is_active),
            editSectionId: new FormControl(this._itemToEdit.sectionId),
            editCategoryId: new FormControl(this._itemToEdit.categoryId),
            editSubcategoryId: new FormControl(this._itemToEdit.subcategoryId)
        });

        this._generalFormGroup = new FormGroup({
            editName: new FormControl(this._itemToEdit.name),
            editDescription: new FormControl(this._itemToEdit.description),
            editImage: new FormControl(''),
            editEstablishments: this._establishmentsFormGroup,
            editCurrencies: this._currenciesFormGroup,
            editTaxes: this._taxesFormGroup
        });

        this._itemSection = this._itemToEdit.sectionId;
        this._selectedSection = this._itemToEdit.sectionId;
        this._itemCategory = this._itemToEdit.categoryId;
        this._selectedCategory = this._itemToEdit.categoryId;
        this._itemSubcategory = this._itemToEdit.subcategoryId;
        this._selectedSubcategory = this._itemToEdit.subcategoryId;

        this._itemEstablishments = this._itemToEdit.establishments;

        this._establishmentsSelectedCount = this._itemToEdit.establishments.length;
        if (this._itemToEdit.establishments.length > 0) { this._showEstablishments = true }

        this._itemsSub = MeteorObservable.subscribe('items', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _itemImg: ItemImage = Items.findOne({ _id: this._itemToEdit._id }).image;
                if (_itemImg) {
                    this._itemEditImageUrl = _itemImg.url;
                } else {
                    this._itemEditImageUrl = '/images/default-plate.png';
                }
            });
        });

        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                Establishments.collection.find({ creation_user: this._user }).fetch().forEach((res) => {
                    _establishmentsId.push(res._id);
                });
                this._sectionsSub = MeteorObservable.subscribe('sections', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._sections = Sections.find({ creation_user: this._user, is_active: true }).zone();
                        let _lSection: Section = Sections.findOne({ _id: this._itemToEdit.sectionId })
                        Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {
                            _currenciesId.push(r.currencyId);

                            let find = this._itemEstablishments.filter(est => r._id === est.establishment_id);

                            if (find.length > 0) {
                                let control: FormControl = new FormControl(true);
                                this._establishmentsFormGroup.addControl(r._id, control);
                                this._establishmentList.push(r);
                            } else {
                                let control: FormControl = new FormControl(false);
                                this._establishmentsFormGroup.addControl(r._id, control);
                                this._establishmentList.push(r);
                            }
                        });
                    });
                });
                this._countriesSub = MeteorObservable.subscribe('getCountriesByEstablishmentsId', _establishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
                this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', _establishmentsId).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        if (this._itemToEdit.prices.length > 0) {
                            this._showCurrencies = true;
                            this._itemToEdit.prices.forEach((p) => {
                                let control: FormControl = new FormControl(p.price, [Validators.required]);
                                this._currenciesFormGroup.addControl(p.currencyId, control);
                                this._establishmentCurrencies.push(p.currencyId);

                                if (p.itemTax !== undefined) {
                                    this._showTaxes = true;
                                    let controlTax: FormControl = new FormControl(p.itemTax, [Validators.required]);
                                    this._taxesFormGroup.addControl(p.currencyId, controlTax);
                                    this._establishmentTaxes.push(p.currencyId);
                                }
                            });
                        }
                        this._currencies = Currencies.find({ _id: { $in: _currenciesId } }).zone();
                    });
                });
            });
        });

        this._categorySub = MeteorObservable.subscribe('categories', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._categories = Categories.find({ section: this._itemSection }).zone();
            });
        });

        this._subcategorySub = MeteorObservable.subscribe('subcategories', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._subcategories = Subcategories.find({ category: this._itemCategory }).zone();
            });
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
     * This function allow move in wizard tabs
     * @param {number} _index
     */
    canMove(_index: number): boolean {
        switch (_index) {
            case 0:
                if (this._sectionsFormGroup.controls['editSectionId'].valid) {
                    return true;
                } else {
                    return false;
                }
            case 1:
                if (this._generalFormGroup.controls['editName'].valid && this._establishmentsSelectedCount > 0) {
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
     * Function to change Section
     * @param {string} _section
     */
    changeSectionEdit(_section): void {
        let _estabishmentSectionsIds: string[] = [];
        this._establishmentList = [];
        this._establishmentCurrencies = [];
        this._establishmentTaxes = [];
        this._sectionsFormGroup.controls['editSectionId'].setValue(_section);
        this._sectionsFormGroup.controls['editCategoryId'].setValue('');
        this._sectionsFormGroup.controls['editSubcategoryId'].setValue('');

        this._categories = Categories.find({ section: _section, is_active: true }).zone();
        if (this._categories.isEmpty) { this._selectedCategory = ""; }

        let _lSection: Section = Sections.findOne({ _id: _section });

        if (_section !== this._itemToEdit.sectionId) {
            this._establishmentsSelectedCount = 0;
            this._showCurrencies = false;

            if (Establishments.collection.find({ _id: { $in: _lSection.establishments } }).count() > 0) {
                Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {
                    if (this._establishmentsFormGroup.contains(r._id)) {
                        this._establishmentsFormGroup.controls[r._id].setValue(false);
                    } else {
                        let control: FormControl = new FormControl(false);
                        this._establishmentsFormGroup.addControl(r._id, control);
                    }

                    _estabishmentSectionsIds.push(r._id);
                    this._establishmentList.push(r);

                    if (this._currenciesFormGroup.contains(r.currencyId)) {
                        this._currenciesFormGroup.controls[r.currencyId].setValue('0');
                    } else {
                        let control: FormControl = new FormControl('0', [Validators.required]);
                        this._currenciesFormGroup.addControl(r.currencyId, control);
                    }

                    let _lCurrency = this._establishmentCurrencies.filter(cur => cur === r.currencyId);
                    if (_lCurrency.length === 0) {
                        this._establishmentCurrencies.push(r.currencyId);
                    }

                    let _lCountry: Country = Countries.findOne({ _id: r.countryId });
                    if (_lCountry.itemsWithDifferentTax === true) {
                        if (this._taxesFormGroup.contains(r.currencyId)) {
                            this._taxesFormGroup.controls[r.currencyId].setValue('0');
                        } else {
                            let controlTax: FormControl = new FormControl('0', [Validators.required]);
                            this._taxesFormGroup.addControl(r.currencyId, controlTax);
                        }
                        let _lTax = this._establishmentTaxes.filter(tax => tax === r.currencyId);
                        if (_lTax.length === 0) {
                            this._establishmentTaxes.push(r.currencyId);
                        }
                        this._showTaxes = true;
                    }
                });
                this._showEstablishments = true;
            } else {
                this._showEstablishments = false;
            }
        } else {
            this._establishmentsSelectedCount = this._itemToEdit.establishments.length;

            if (Establishments.collection.find({ _id: { $in: _lSection.establishments } }).count() > 0) {
                Establishments.collection.find({ _id: { $in: _lSection.establishments } }).fetch().forEach((r) => {

                    let find = this._itemEstablishments.filter(est => r._id === est.establishment_id);

                    if (find.length > 0) {
                        if (this._establishmentsFormGroup.contains(r._id)) {
                            this._establishmentsFormGroup.controls[r._id].setValue(true);
                        } else {
                            let control: FormControl = new FormControl(true);
                            this._establishmentsFormGroup.addControl(r._id, control);
                        }
                    } else {
                        if (this._establishmentsFormGroup.contains(r._id)) {
                            this._establishmentsFormGroup.controls[r._id].setValue(false);
                        } else {
                            let control: FormControl = new FormControl(false);
                            this._establishmentsFormGroup.addControl(r._id, control);
                        }
                    }
                    _estabishmentSectionsIds.push(r._id);
                    this._establishmentList.push(r);
                });

                if (this._itemToEdit.prices.length > 0) {
                    this._showCurrencies = true;
                    this._itemToEdit.prices.forEach((p) => {
                        if (this._currenciesFormGroup.contains(p.currencyId)) {
                            this._currenciesFormGroup.controls[p.currencyId].setValue(p.price);
                        } else {
                            let control: FormControl = new FormControl(p.price, [Validators.required]);
                            this._currenciesFormGroup.addControl(p.currencyId, control);
                        }
                        this._establishmentCurrencies.push(p.currencyId);
                        if (p.itemTax !== undefined) {
                            this._showTaxes = true;
                            if (this._taxesFormGroup.contains(p.currencyId)) {
                                this._taxesFormGroup.controls[p.currencyId].setValue(p.itemTax);
                            } else {
                                let controlTax: FormControl = new FormControl(p.itemTax, [Validators.required]);
                                this._taxesFormGroup.addControl(p.currencyId, controlTax);
                            }
                            this._establishmentTaxes.push(p.currencyId);
                        }
                    });
                }
                this._showEstablishments = true;
            } else {
                this._showEstablishments = false;
            }
        }
    }

    /**
     * Function to change category
     * @param {string} _category
     */
    changeCategoryEdit(_category) {
        this._sectionsFormGroup.controls['editCategoryId'].setValue(_category);
        this._sectionsFormGroup.controls['editSubcategoryId'].setValue('');
        this._subcategories = Subcategories.find({ category: _category, is_active: true }).zone();
        if (this._subcategories.isEmpty) { this._selectedSubcategory = ""; }
    }

    /**
     * Function to change subcategory
     * @param {string} _subcategory
     */
    changeSubcategoryEdit(_subcategory) {
        this._sectionsFormGroup.controls['editSubcategoryId'].setValue(_subcategory);
    }

    /**
     * Function to insert new image
     */
    changeImage(): void {
        this._imageService.client.pick(this._imageService.pickOptions).then((res) => {
            let _imageToUpload: any = res.filesUploaded[0];
            this._nameImageFileEdit = _imageToUpload.filename;
            this._editItemImageToInsert = _imageToUpload;
            this._editImage = true;
        }).catch((err) => {
            var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
        });
    }

    /**
     * Function to edit Item
     */
    editItem(): void {
        if (!Meteor.userId()) {
            var error: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';
            this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
            return;
        }

        this._loading = true;
        setTimeout(() => {
            let arrCur: any[] = Object.keys(this._generalFormGroup.value.editCurrencies);
            let _lItemEstablishmentsToInsert: ItemEstablishment[] = [];
            let _lItemPricesToInsert: ItemPrice[] = [];

            arrCur.forEach((cur) => {
                let find: Establishment[] = this._establishmentList.filter(r => r.currencyId === cur);
                for (let res of find) {
                    if (this._generalFormGroup.value.editEstablishments[res._id]) {
                        let _lItemEstablishment: ItemEstablishment = { establishment_id: '', price: 0, isAvailable: true, recommended: false };
                        _lItemEstablishment.establishment_id = res._id;
                        _lItemEstablishment.price = this._generalFormGroup.value.editCurrencies[cur];

                        if (this._generalFormGroup.value.editTaxes[cur] !== undefined) {
                            _lItemEstablishment.itemTax = this._generalFormGroup.value.editTaxes[cur];
                        }

                        _lItemEstablishmentsToInsert.push(_lItemEstablishment);
                    }
                }
                if (cur !== null && this._generalFormGroup.value.editCurrencies[cur] !== null) {
                    let _lItemPrice: ItemPrice = { currencyId: '', price: 0 };
                    _lItemPrice.currencyId = cur;
                    _lItemPrice.price = this._generalFormGroup.value.editCurrencies[cur];
                    if (this._generalFormGroup.value.editTaxes[cur] !== undefined) {
                        _lItemPrice.itemTax = this._generalFormGroup.value.editTaxes[cur];
                    }
                    _lItemPricesToInsert.push(_lItemPrice);
                }
            });

            if (_lItemEstablishmentsToInsert.length > 0) {
                if (this._editImage) {
                    /*let _lItemImage: ItemImage = Items.findOne({ _id: this._itemToEdit._id }).image;
                   if (_lItemImage) {
                       this._imageService.client.remove(_lItemImage.handle).then((res) => {
                           console.log(res);
                       }).catch((err) => {
                           var error: string = this.itemNameTraduction('UPLOAD_IMG_ERROR');
                           this.openDialog(this.titleMsg, '', error, '', this.btnAcceptLbl, false);
                       });
                   }*/
                    Items.update(this._sectionsFormGroup.value.editId, {
                        $set: {
                            modification_user: this._user,
                            modification_date: new Date(),
                            is_active: this._sectionsFormGroup.value.editIsActive,
                            sectionId: this._sectionsFormGroup.value.editSectionId,
                            categoryId: this._sectionsFormGroup.value.editCategoryId,
                            subcategoryId: this._sectionsFormGroup.value.editSubcategoryId,
                            name: this._generalFormGroup.value.editName,
                            description: this._generalFormGroup.value.editDescription,
                            establishments: _lItemEstablishmentsToInsert,
                            prices: _lItemPricesToInsert,
                            image: this._editItemImageToInsert
                        }
                    });
                } else {
                    Items.update(this._sectionsFormGroup.value.editId, {
                        $set: {
                            modification_user: this._user,
                            modification_date: new Date(),
                            is_active: this._sectionsFormGroup.value.editIsActive,
                            sectionId: this._sectionsFormGroup.value.editSectionId,
                            categoryId: this._sectionsFormGroup.value.editCategoryId,
                            subcategoryId: this._sectionsFormGroup.value.editSubcategoryId,
                            name: this._generalFormGroup.value.editName,
                            description: this._generalFormGroup.value.editDescription,
                            establishments: _lItemEstablishmentsToInsert,
                            prices: _lItemPricesToInsert
                        }
                    });
                }
                let _lMessage: string = this.itemNameTraduction('ITEMS.ITEM_EDITED');
                this.snackBar.open(_lMessage, '', { duration: 2500 });
                this._router.navigate(['app/items']);
            } else {
                this._showGeneralError = true;
            }
            this._loading = false;
        }, 3500);
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
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
                let _lCurrency: Currency = Currencies.findOne({ _id: _lEstablishment.currencyId });
                let _initValue: string = '';
                if (_lCurrency.decimal !== 0) {
                    for (let i = 0; i < (_lCurrency.decimal).toString().slice((_lCurrency.decimal.toString().indexOf('.')), (_lCurrency.decimal.toString().length)).length - 1; i++) {
                        _initValue += '0';
                    }
                    _initValue = '0.' + _initValue;
                }
                if (this._currenciesFormGroup.contains(_lEstablishment.currencyId)) {
                    this._currenciesFormGroup.controls[_lEstablishment.currencyId].setValue(_initValue);
                } else {
                    let control: FormControl = new FormControl(_initValue, [Validators.required]);
                    this._currenciesFormGroup.addControl(_lEstablishment.currencyId, control);
                }
                this._establishmentCurrencies.push(_lEstablishment.currencyId);

                if (_lCountry.itemsWithDifferentTax === true) {
                    if (this._taxesFormGroup.contains(_lEstablishment.currencyId)) {
                        this._taxesFormGroup.controls[_lEstablishment.currencyId].setValue('0');
                    } else {
                        let control: FormControl = new FormControl('0', [Validators.required]);
                        this._taxesFormGroup.addControl(_lEstablishment.currencyId, control);
                    }
                    this._establishmentTaxes.push(_lEstablishment.currencyId);
                }
            }
        } else {
            this._establishmentsSelectedCount--;
            let _aux: number = 0;
            let _auxTax: number = 0;
            let arr: any[] = Object.keys(this._generalFormGroup.value.editEstablishments);
            arr.forEach((rest) => {
                if (this._generalFormGroup.value.editEstablishments[rest]) {
                    let _lRes: Establishment = this._establishmentList.find(r => r._id === rest);
                    if (_lRes) {
                        if (_lEstablishment.currencyId === _lRes.currencyId) {
                            _aux++;
                        }
                        let _lCountry: Country = Countries.findOne({ _id: _lRes.countryId });
                        if (_lCountry.itemsWithDifferentTax === true) {
                            _auxTax++;
                        }
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
     * Function to cancel edit Item
     */
    cancel(): void {
        if (this._selectedSection !== "") { this._selectedSection = ""; }
        if (this._selectedCategory !== "") { this._selectedCategory = ""; }
        if (this._selectedSubcategory !== "") { this._selectedSubcategory = ""; }
        this._editImage = false;
        this._sectionsFormGroup.reset();
        this._generalFormGroup.reset();
        this._router.navigate(['app/items']);
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