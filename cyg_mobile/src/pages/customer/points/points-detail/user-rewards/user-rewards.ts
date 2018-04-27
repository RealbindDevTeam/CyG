import { Component, Input, NgZone, OnInit, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { AlertController, Platform } from 'ionic-angular';
import { UserLanguageServiceProvider } from '../../../../../providers/user-language-service/user-language-service';
import { RewardHistory } from 'cyg_web/both/models/points/reward-history.model';
import { RewardHistories } from 'cyg_web/both/collections/points/reward-history.collection';
import { Network } from '@ionic-native/network';
import { MeteorObservable } from 'meteor-rxjs';

@Component({
    selector: 'page-user-rewards',
    templateUrl: 'user-rewards.html'
})
export class UserRewardsPage implements OnInit, OnDestroy {

    @Input()
    establishmentId: string;

    private _user = Meteor.userId();
    private _rewardHistoriesSub: Subscription;
    private disconnectSubscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _rewardHistories: Observable<RewardHistory[]>;
    private _showUserRewards: boolean = false;

    /**
     * UserRewardsPage Constructor
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone 
     * @param {AlertController} alertCtrl 
     * @param {Platform} _platform 
     * @param {Network} _network 
     */
    constructor(public _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        public alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this._rewardHistoriesSub = MeteorObservable.subscribe('getRewardHistoriesByEstablishmentId', this.establishmentId).subscribe(() => {
            this._ngZone.run(() => {
                this._rewardHistories = RewardHistories.find({ establishment_id: this.establishmentId }).zone();
                this._rewardHistories.subscribe(() => { this.countRewardHistories(); });
            });
        });
    }

    /**
     * Count reward histories
     */
    countRewardHistories(): void {
        RewardHistories.collection.find({ establishment_id: this.establishmentId }).count() > 0 ? this._showUserRewards = true : this._showUserRewards = false;
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
        let alert = this.alertCtrl.create({
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

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * This function lets to tranla
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
     * Remove all susbscriptions
     */
    removeSubscriptions() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}