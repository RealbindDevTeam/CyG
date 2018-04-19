import { Component, NgZone, OnInit, OnDestroy } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Observable, Subject } from 'rxjs';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Establishment } from 'cyg_web/both/models/establishment/establishment.model';
import { Establishments } from 'cyg_web/both/collections/establishment/establishment.collection';
import { EstablishmentMedal } from 'cyg_web/both/models/points/establishment-medal.model';
import { EstablishmentMedals } from 'cyg_web/both/collections/points/establishment-medal.collection';
import { Network } from '@ionic-native/network';
import { RewardListComponent } from './reward-list/reward-list';

@Component({
    selector: 'rewards',
    templateUrl: 'rewards.html'
})
export class RewardsPage implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentsSub: Subscription;
    private _establishmentMedalSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishmentMedals: Observable<EstablishmentMedal[]>;
    private _establishments: Observable<Establishment[]>;

    private _showEstablishments: boolean = true;
    private disconnectSubscription: Subscription;

    /**
     * RewardsPage constructor
     * @param {NavController} _navCtrl
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone 
     */
    constructor(public _navCtrl: NavController,
        public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone, public _alertCtrl: AlertController,
        public _platform: Platform, private _network: Network) {
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        let _lEstablishmentsIds: string[] = [];
        this._establishmentMedalSub = MeteorObservable.subscribe('getEstablishmentMedalsByUserId', this._user).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentMedals = EstablishmentMedals.find({ user_id: this._user }).zone();
                this._establishmentMedals.subscribe(() => { this.validateEstablishmentMedals(); });
                EstablishmentMedals.collection.find({ user_id: this._user }).fetch().forEach((est) => {
                    _lEstablishmentsIds.push(est.establishment_id);
                });
                this._establishmentsSub = MeteorObservable.subscribe('getEstablishmentsByIds', _lEstablishmentsIds).takeUntil(this.ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._establishments = Establishments.find({ _id: { $in: _lEstablishmentsIds } }).zone();
                    });
                });
            });
        });
    }

    /**
     * Validate establishment medals count
     */
    validateEstablishmentMedals(): void {
        EstablishmentMedals.collection.find({ user_id: this._user }).count() > 0 ? this._showEstablishments = true : this._showEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * Open reward list
     * @param {string} _establishmentId 
     */
    openRewardList(_establishmentId: string): void {
        this._navCtrl.push(RewardListComponent, { establishment: _establishmentId });
    }

    /** 
     * This function verify the conditions on page did enter for internet and server connection
    */
    ionViewDidEnter() {
        this.isConnected();
        this.disconnectSubscription = this._network.onDisconnect().subscribe(data => {
            let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
            let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
            let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
            this.presentAlert(title, subtitle, btn);
        }, error => console.error(error));
    }

    /** 
     * This function verify with network plugin if device has internet connection
    */
    isConnected() {
        if (this._platform.is('cordova')) {
            let conntype = this._network.type;
            let validateConn = conntype && conntype !== 'unknown' && conntype !== 'none';
            if (!validateConn) {
                let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
                let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
                let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
                this.presentAlert(title, subtitle, btn);
            } else {
                if (!Meteor.status().connected) {
                    let title2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.TITLE');
                    let subtitle2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.SUBTITLE');
                    let btn2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.BTN');
                    this.presentAlert(title2, subtitle2, btn2);
                }
            }
        }
    }

    /**
     * Present the alert for advice to internet
    */
    presentAlert(_pTitle: string, _pSubtitle: string, _pBtn: string) {
        let alert = this._alertCtrl.create({
            title: _pTitle,
            subTitle: _pSubtitle,
            enableBackdropDismiss: false,
            buttons: [
                {
                    text: _pBtn,
                    handler: () => {
                        this.isConnected();
                    }
                }
            ]
        });
        alert.present();
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}