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
import { EstablishmentPoint } from '../../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../../both/collections/points/establishment-points.collection';
import { BagPlan } from '../../../../../../../both/models/points/bag-plan.model';
import { BagPlans } from '../../../../../../../both/collections/points/bag-plans.collection';

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
    private _establishmentSub: Subscription;
    private _currencySub: Subscription;
    private _countrySub: Subscription;
    private _establishmentPointSub: Subscription;
    private _bagPlansSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _establishmentsArray: Establishment[] = [];
    private dataSource: any;
    private _thereAreEstablishments: boolean = true;
    private _total: number = 0;
    private _tmpBagsArray: Element[] = [];

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
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    ngOnInit() {
        this.removeSubscriptions();

        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ creation_user: this._user }).zone();
                this.countEstablishments();
                this._establishments.subscribe(() => { this.countEstablishments(); });
                this._establishmentsArray = Establishments.find({ creation_user: this._user }).fetch();

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
                    this._bagPlans = BagPlans.find({}).zone();
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
    addPlan(_bagPlan: BagPlan, _establishmentId: string) {
        console.log(_bagPlan);
        console.log(_establishmentId);

        let indexOfElement: number = this._tmpBagsArray.map(function (element) { return element.establishmentId }).indexOf(_establishmentId);
        console.log(indexOfElement);

        if (indexOfElement > -1) {
            let obj = {
                establishmentId: _establishmentId,
                bagPlanPrice: _bagPlan.price.price
            };
            this._tmpBagsArray.splice(indexOfElement, 1, obj);

            console.log('---');
            console.log(this._tmpBagsArray);

        } else {
            let obj = {
                establishmentId: _establishmentId,
                bagPlanPrice: _bagPlan.price.price
            };
            this._tmpBagsArray.push(obj);

            console.log(this._tmpBagsArray);
        }


    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {

    }
}


export interface Element {
    establishmentId: string;
    bagPlanPrice: number;
}
