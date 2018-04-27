import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../services/general/user-language.service';
import { Establishment } from '../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../both/collections/establishment/establishment.collection';
import { EstablishmentPoint } from '../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../both/collections/points/establishment-points.collection';

@Component({
  selector: 'admin-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  private _user = Meteor.userId();
  private _establishments: Observable<Establishment[]>;

  private _establishmentsSub: Subscription;
  private _establishmentPointsSub: Subscription;
  private _ngUnsubscribe: Subject<void> = new Subject<void>();
  private _thereAreEstablishments: boolean = true;

  /**
   * DashboardComponent Constructor
   * @param {TranslateService} _translate 
   * @param {NgZone} _ngZone 
   * @param {Router} _router
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
    let _lEstablishmentsId: string[] = [];
    this._establishmentsSub = MeteorObservable.subscribe('getActiveEstablishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
      this._ngZone.run(() => {
        this._establishments = Establishments.find({ creation_user: this._user, isActive: true }).zone();
        this.countResturants();
        this._establishments.subscribe(() => { this.countResturants(); });
        Establishments.collection.find({ creation_user: this._user, isActive: true }).fetch().forEach((establishment: Establishment) => {
          _lEstablishmentsId.push(establishment._id);
        });
        this._establishmentPointsSub = MeteorObservable.subscribe('getEstablishmentPointsByIds', _lEstablishmentsId).takeUntil(this._ngUnsubscribe).subscribe();
      });
    });
  }

  /**
   * Validate if establishments exists
   */
  countResturants(): void {
    Establishments.collection.find({ creation_user: this._user, isActive: true }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
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
    this._router.navigate(['/app/reward-units-chart', _pEstablishment], { skipLocationChange: true });
  }

  /**
   * Go to rewards history chart
   * @param _pEstablishmentId
   */
  goToRewardHistoryCharts(_pEstablishment: string) {
    this._router.navigate(['/app/reward-history-chart', _pEstablishment], { skipLocationChange: true });
  }

  /**
   * Go to add new Establishment
   */
  goToAddEstablishment() {
    this._router.navigate(['/app/establishment-register']);
  }

  /**
   * ngOnDestroy Implementation
   */
  ngOnDestroy() {
    this.removeSubscriptions();
  }
}
