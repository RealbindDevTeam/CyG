import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { Router } from '@angular/router';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { UserDetail } from '../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../both/collections/auth/user-detail.collection';
import { EstablishmentPoint } from '../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../both/collections/points/establishment-points.collection';

@Component({
    selector: 'supervisor-dashboard',
    templateUrl: './supervisor-dashboard.component.html',
    styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishments: Observable<Establishment[]>;

    private _establishmentsSub: Subscription;
    private _userDetailsSub: Subscription;
    private _establishmentPointsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    /**
     * SupervisorDashboardComponent Constructor
     * @param {TranslateService} _translate 
     * @param {NgZone} _ngZone 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _translate: TranslateService,
        private _ngZone: NgZone,
        private _router: Router,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        let _establishmentWorkId: string;
        this._userDetailsSub = MeteorObservable.subscribe('getUserDetailsByUser', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                _establishmentWorkId = UserDetails.findOne({ user_id: this._user }).establishment_work;
                this._establishmentsSub = MeteorObservable.subscribe('getEstablishmentByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._establishments = Establishments.find({ _id: _establishmentWorkId }).zone();
                    });
                });
                this._establishmentPointsSub = MeteorObservable.subscribe('getEstablishmentPointsByIds', [_establishmentWorkId]).takeUntil(this._ngUnsubscribe).subscribe();
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
     * Get Establishment Points
     * @param {string} _pEstablishmentId 
     */
    getEstablishmentPoints(_pEstablishmentId: string): number {
        let _establishmentPoint: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _pEstablishmentId });
        if (_establishmentPoint) {
            return _establishmentPoint.current_points;
        } else {
            return 0;
        }
    }

    /**
     * Go to rewards history chart
     * @param _pEstablishmentId
     */
    goToRewardUnitsCharts(_pEstablishment: string) {
        this._router.navigate(['/app/supervisor-reward-units-chart', _pEstablishment], { skipLocationChange: true });
    }

    /**
     * Go to rewards history chart
     * @param _pEstablishmentId
     */
    goToRewardHistoryCharts(_pEstablishment: string) {
        this._router.navigate(['/app/supervisor-reward-history-chart', _pEstablishment], { skipLocationChange: true });
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}
