import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { Meteor } from 'meteor/meteor';
import { Chart } from 'angular-highcharts';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { RewardHistory } from '../../../../../../../both/models/points/reward-history.model';
import { RewardHistories } from '../../../../../../../both/collections/points/reward-history.collection';

@Component({
    selector: 'reward-units-chart',
    templateUrl: './reward-units-chart.component.html',
    styleUrls: ['./reward-units-chart.component.scss']
})

export class RewardUnitsChartComponent implements OnInit, OnDestroy {

    private _establishmentId: string = null;
    private rewardUnitsChart;
    private _establishmentsSubscription: Subscription;
    private _rewardHistoriesSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _rewardHistories: Observable<RewardHistory[]>;
    private _establishment: Establishment = null;

    private xAxisArray: string[] = [];
    private todaySeriesArray: number[] = [];
    private _today: Date = new Date();
    private _todayDateIni: Date;
    private _todayDateEnd: Date;
    private rewardNameArray: string[];

    /**
    * @param {TranslateService} _translate 
    * @param {NgZone} _ngZone 
    * @param {Router} _router
    * @param {UserLanguageService} _userLanguageService
    */

    constructor(private _activatedRoute: ActivatedRoute,
        private _translate: TranslateService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

        this._activatedRoute.params.forEach((params: Params) => {
            this._establishmentId = params['param1'];
        });

        this._todayDateIni = new Date();
        this._todayDateEnd = new Date();
    }

    ngOnInit() {
        this.removeSubscriptions();
        this._establishmentsSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishment = Establishments.findOne({ _id: this._establishmentId });
            });
        });

        this._rewardHistoriesSubscription = MeteorObservable.subscribe('getRewardHistoriesByEstablishmentId', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._rewardHistories = RewardHistories.find({ establishment_id: this._establishmentId }).zone();
            this._rewardHistories.subscribe(() => {
                this.setBarChartData();
            });
        });
    }

    /**
    * Set the chart data according to the initial conditions
    */
    setBarChartData() {
        let chartTitle: string = this.itemNameTraduction('REWARD_UNIT_CHART.CHART_TITLE');
        let chartSubtitle: string = this.itemNameTraduction('REWARD_UNIT_CHART.CHART_SUBTITLE');
        let unitsLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.UNITS_LBL');
        let itemsLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.REWARDS_LBL');
        let todayLbl: string = this.itemNameTraduction('REWARD_UNIT_CHART.TODAY');

        this.xAxisArray = [];
        this.todaySeriesArray = [];
        this.rewardNameArray = [];

        RewardHistories.collection.find({
            creation_date: {
                $gte: new Date(this._todayDateIni.getFullYear(), this._todayDateIni.getMonth(), this._todayDateIni.getDate()),
                $lte: new Date(this._todayDateEnd.getFullYear(), this._todayDateEnd.getMonth(), this._todayDateEnd.getDate(), 23, 59, 59)
            }
        }).fetch().forEach((rewardHistory) => {
            let indexofvar = this.rewardNameArray.indexOf(rewardHistory.item_name);
            if (indexofvar < 0) {
                this.rewardNameArray.push(rewardHistory.item_name);
            }
        });

        this.rewardNameArray.sort();
        this.xAxisArray = this.rewardNameArray;

        this.rewardNameArray.forEach((itemName) => {
            let _todayAggregate: number = 0;

            RewardHistories.collection.find({
                item_name: itemName,
                creation_date: {
                    $gte: new Date(this._todayDateIni.getFullYear(), this._todayDateIni.getMonth(), this._todayDateIni.getDate()),
                    $lte: new Date(this._todayDateEnd.getFullYear(), this._todayDateEnd.getMonth(), this._todayDateEnd.getDate(), 23, 59, 59)
                }
            }).fetch().forEach((rewardHistory) => {
                if (rewardHistory.item_name === itemName) {
                    _todayAggregate = _todayAggregate + rewardHistory.item_quantity;
                }
            });
            this.todaySeriesArray.push(_todayAggregate);
        });

        this.rewardUnitsChart = new Chart({
            chart: {
                type: 'bar'
            },
            title: {
                text: chartTitle,
            },
            subtitle: {
                text: chartSubtitle
            },
            xAxis: {
                categories: this.xAxisArray,
                title: {
                    text: itemsLbl
                }
            },
            yAxis: {
                min: 0,
                allowDecimals: false,
                title: {
                    text: unitsLbl,
                    align: 'high'
                },
                labels: {
                    overflow: 'justify'
                }
            },
            tooltip: {
                valueSuffix: ' ' + unitsLbl
            },
            plotOptions: {
                bar: {
                    dataLabels: {
                        enabled: true
                    }
                }
            },
            legend: {
                align: 'right',
                verticalAlign: 'top',
                layout: 'vertical',
                x: 0,
                y: 100
            },
            credits: {
                enabled: false
            },
            series: [{
                name: todayLbl,
                data: this.todaySeriesArray,
                color: '#2196F3'
            }
            ]
        });
    }

    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
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
    * NgOnDestroy implementation
    */
    ngOnDestroy() {
        this.removeSubscriptions();
    }

}