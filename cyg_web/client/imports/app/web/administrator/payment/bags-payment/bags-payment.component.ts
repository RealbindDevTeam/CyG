import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { MatTableDataSource } from '@angular/material';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Currency } from '../../../../../../../both/models/general/currency.model';
import { Currencies } from '../../../../../../../both/collections/general/currency.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { EstablishmentPoint, Element } from '../../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../../both/collections/points/establishment-points.collection';
import { BagPlan } from '../../../../../../../both/models/points/bag-plan.model';
import { BagPlans } from '../../../../../../../both/collections/points/bag-plans.collection';
import { NegativePoint } from '../../../../../../../both/models/points/negative-point.model';
import { NegativePoints } from '../../../../../../../both/collections/points/negative-points.collection';
import { PackageMedalService } from '../../../services/payment/package-medal.service';

@Component({
    selector: 'bags-payment',
    templateUrl: './bags-payment.component.html',
    styleUrls: ['./bags-payment.component.scss']
})

export class BagsPaymentComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishments: Observable<Establishment[]>;
    private _currencies: Observable<Currency[]>;
    private _countries: Observable<Country[]>;
    private _establishmentPoints: Observable<EstablishmentPoint[]>;
    private _bagPlans: Observable<BagPlan[]>;
    private _negativePoints: Observable<NegativePoint[]>;
    private _establishmentSub: Subscription;
    private _currencySub: Subscription;
    private _countrySub: Subscription;
    private _establishmentPointSub: Subscription;
    private _bagPlansSub: Subscription;
    private _negativePointsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private dataSource: any;
    private _thereAreEstablishments: boolean = true;
    private _total: number = 0;
    private _tmpBagsArray: Element[] = [];
    private _establishmentSelected: string[] = [];
    private _indexSelected: number[] = [];
    private _purchasePlanForm: FormGroup;
    private _establishmentBagForm: FormGroup = new FormGroup({});
    private _establishmentsArray: string[] = [];

    /**
     * MonthlyPaymentComponent Constructor
     * @param {Router} router
     * @param {NgZone} _ngZone
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private router: Router,
        private translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        private _packageMedalService: PackageMedalService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    ngOnInit() {
        this.removeSubscriptions();

        this._purchasePlanForm = new FormGroup({
            establishment_bag: this._establishmentBagForm
        });

        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ creation_user: this._user }).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });

                Establishments.find({ creation_user: this._user }).fetch().forEach((establishmentCtrl) => {
                    let _establishmentCheckControl: FormControl = new FormControl();
                    this._establishmentBagForm.addControl('chk_' + establishmentCtrl._id, _establishmentCheckControl);

                    let _establishmentSelectControl: FormControl = new FormControl();
                    this._establishmentBagForm.addControl('sel_' + establishmentCtrl._id, _establishmentSelectControl);
                    _establishmentSelectControl.disable();

                    let _establishmentLabelControl: FormControl = new FormControl();
                    this._establishmentBagForm.addControl('lbl_' + establishmentCtrl._id, _establishmentLabelControl);
                    _establishmentLabelControl.disable();

                    this._establishmentsArray.push(establishmentCtrl._id);
                });

                this._negativePointsSub = MeteorObservable.subscribe('getNegativePointsByEstablishmentsArray', this._establishmentsArray).takeUntil(this._ngUnsubscribe).subscribe();

                this._currencySub = MeteorObservable.subscribe('getCurrenciesByUserId', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        let _currenciesIds: string[] = [];
                        Establishments.collection.find({ creation_user: Meteor.userId() }).forEach(function <Establishment>(establishment, index, args) {
                            _currenciesIds.push(establishment.currencyId);
                        });
                        this._currencies = Currencies.find({ _id: { $in: _currenciesIds } }).zone();
                    });
                });

                this._bagPlansSub = MeteorObservable.subscribe('getBagPlansNoFree').takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._bagPlans = BagPlans.find({ name: { $nin: ['free'] } }).zone();
                });
            });
        });
        this._establishmentPointSub = MeteorObservable.subscribe('getEstablishmentPointsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentPoints = EstablishmentPoints.find({ creation_user: this._user }).zone();
            });
        });
        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({}).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
    * This function gets the coutry according to currency
    * @param {string} _currencyId
    * @return {string}
    */
    getCountryByCurrency(_currencyId: string): string {
        let country_name: Country;
        country_name = Countries.findOne({ currencyId: _currencyId });
        if (country_name) {
            return country_name.name;
        } else {
            return "";
        }
    }

    /**
     * Function to add plan to establishment
     */
    addPlan(_bagPlan: BagPlan, _establishment: Establishment) {

        this._total = 0;
        let bagPlanInfo: Element = this.getBagPlanInfo(_bagPlan._id, _establishment);

        let indexOfElement: number = this._tmpBagsArray.map(function (element) { return element.establishmentId }).indexOf(_establishment._id);
        if (indexOfElement > -1) {
            let pricePending: number = 0;
            let pointsPending: number = 0;
            if (this.hasPendingMedals(_establishment._id)) {
                pricePending = this.getPriceByPending(_establishment);
                pointsPending = this.getPendingMedals(_establishment._id);
            }
            bagPlanInfo.creditPrice = pricePending;
            bagPlanInfo.creditPoints = pointsPending;
            this._tmpBagsArray.splice(indexOfElement, 1, bagPlanInfo);
            this._tmpBagsArray.forEach((bagElement) => {
                this._total = this._total + bagElement.bagPlanPrice + bagElement.creditPrice;;
            });

            this._establishmentBagForm.controls['sel_' + _establishment._id].setValue(bagPlanInfo.bagPlanId);
            this._establishmentBagForm.controls['lbl_' + _establishment._id].setValue(bagPlanInfo.bagPlanPrice + ' ' + bagPlanInfo.bagPlanCurrency);
        }
    }

    /**
     * Function to enable row
     */
    addToRowArray(_establishment: Establishment, isChecked: boolean, index: number) {

        this._total = 0;
        let bagPlanInfo: Element = this.getBagPlanInfo('400', _establishment);
        if (isChecked) {
            let indexOfElement: number = this._tmpBagsArray.map(function (element) { return element.establishmentId }).indexOf(_establishment._id);
            if (indexOfElement > -1) {
                this._tmpBagsArray.forEach((bagElement) => {
                    this._total = this._total + bagElement.bagPlanPrice;
                });
            } else {
                let pricePending: number = 0;
                let pointsPending: number = 0;
                if (this.hasPendingMedals(_establishment._id)) {
                    pricePending = this.getPriceByPending(_establishment);
                    pointsPending = this.getPendingMedals(_establishment._id);
                }
                bagPlanInfo.creditPrice = pricePending;
                bagPlanInfo.creditPoints = pointsPending;
                this._tmpBagsArray.push(bagPlanInfo);
                this._tmpBagsArray.forEach((bagElement) => {
                    this._total = this._total + bagElement.bagPlanPrice + bagElement.creditPrice;
                });

                this._establishmentBagForm.controls['sel_' + _establishment._id].enable();
                this._establishmentBagForm.controls['sel_' + _establishment._id].setValue(bagPlanInfo.bagPlanId);
                this._establishmentBagForm.controls['lbl_' + _establishment._id].setValue(bagPlanInfo.bagPlanPrice + ' ' + bagPlanInfo.bagPlanCurrency);
            }
        } else {
            let indexOfElement: number = this._tmpBagsArray.map(function (element) { return element.establishmentId }).indexOf(_establishment._id);
            if (indexOfElement > -1) {
                this._tmpBagsArray.splice(indexOfElement, 1);
                let pricePending: number = 0;
                let pointsPending: number = 0;
                if (this.hasPendingMedals(_establishment._id)) {
                    pricePending = this.getPriceByPending(_establishment);
                    pointsPending = this.getPendingMedals(_establishment._id);
                }
                bagPlanInfo.creditPrice = pricePending;
                bagPlanInfo.creditPoints = pointsPending;
                this._tmpBagsArray.forEach((bagElement) => {
                    this._total = this._total + bagElement.bagPlanPrice + bagElement.creditPrice;;
                });
                this._establishmentBagForm.controls['sel_' + _establishment._id].reset();
                this._establishmentBagForm.controls['sel_' + _establishment._id].disable();
                this._establishmentBagForm.controls['lbl_' + _establishment._id].reset();
            }
        }
    }

    /**
     * Function to get bag plan info selected according to establishment country
     */
    getBagPlanInfo(_bagPLanId: string, _establishment: Establishment): Element {
        let _lBagPlan: BagPlan = BagPlans.findOne({ _id: _bagPLanId, 'price.country_id': _establishment.countryId });
        let initialPrice: number = 0;
        let initialCurrency: string = '';
        let initialPoints: number = _lBagPlan.value_points;

        _lBagPlan.price.forEach((priceObj) => {
            if (priceObj.country_id === _establishment.countryId) {
                initialPrice = priceObj.price;
                initialCurrency = priceObj.currency
            }
        });

        let obj: Element = {
            establishmentId: _establishment._id,
            bagPlanId: _lBagPlan._id,
            bagPlanPrice: initialPrice,
            bagPlanCurrency: initialCurrency,
            bagPlanPoints: initialPoints
        }
        return obj;
    }

    /**
     * Function to validate if establishment has pending medals to pay
     */
    hasPendingMedals(_establishmentId: string): boolean {
        let countOfNegative: number = NegativePoints.collection.find({ establishment_id: _establishmentId, paid: false }).count();
        if (countOfNegative > 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Function to get medals pending for establishment
     */
    getPendingMedals(_establishmentId: string): number {
        let totalPending: number = 0;
        NegativePoints.collection.find({ establishment_id: _establishmentId, paid: false }).map(function (negativePt) {
            totalPending += negativePt.points;
        });
        return totalPending;
    }

    /**
     * Function to get price by pending medals
     */
    getPriceByPending(_establishment: Establishment): number {
        let bagPlanInfo: Element = this.getBagPlanInfo('200', _establishment);
        let pendingMedals: number = this.getPendingMedals(_establishment._id);
        let pedingMedalsPrice: number = (pendingMedals * bagPlanInfo.bagPlanPrice) / bagPlanInfo.bagPlanPoints;
        return Math.round(pedingMedalsPrice);
    }

    /**
     * Function to go to payment form
     */
    goToPaymentForm() {
        this.dataArray = this._tmpBagsArray;
        this.router.navigate(['/app/payment-form'], { skipLocationChange: true })
    }

    /**
     * Set de bag plans to pay array
     */
    set dataArray(value: Element[]) {
        this._packageMedalService.bagPlanArray = value;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
    * Implements ngOnDestroy function
    */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}