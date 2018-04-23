import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { AlertController, NavParams, LoadingController, NavController, ViewController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';
import { Subscription, Subject, Observable } from 'rxjs';
import { Establishment } from 'cyg_web/both/models/establishment/establishment.model';
import { Establishments } from 'cyg_web/both/collections/establishment/establishment.collection';
import { RewardListComponent } from '../rewards/reward-list/reward-list';

@Component({
    selector: 'medal-won',
    templateUrl: 'medal-won.html'
})
export class MedalWonPage implements OnInit {

    private _establishmentId: string = '';

    private _establishmentSub: Subscription;
    private disconnectSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishments: Observable<Establishment[]>;

    /**
     * MedalWonPage Constructor
     * @param {NavController} _navCtrl 
     * @param {NavParams} _navParams
     * @param {ViewController} _viewCtrl 
     * @param {TranslateService} _translate 
     * @param {AlertController} _alertCtrl 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {Platform} _platform 
     * @param {Network} _network 
     * @param {NgZone} _ngZone
     */
    constructor(private _navCtrl: NavController,
        public _navParams: NavParams,
        private _viewCtrl: ViewController,
        public _translate: TranslateService,
        public _alertCtrl: AlertController,
        private _userLanguageService: UserLanguageServiceProvider,
        public _platform: Platform,
        private _network: Network,
        private _ngZone: NgZone) {
        _translate.setDefaultLang('en');
        this._establishmentId = this._navParams.get("est_id");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this.init();
    }

    ionViewWillEnter() {
        this.removeSubscriptions();
        this.init();
    }

    /**
     * Initial function
     */
    init() {
        this.removeSubscriptions();
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._establishmentSub = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ _id: this._establishmentId }).zone();
            });
        });
    }

    /**
     * Function to show establishment rewards
     */
    showRewards(): void {
        this._navCtrl.push(RewardListComponent, { establishment: this._establishmentId }).then(() => {
            const index = this._viewCtrl.index;
            this._navCtrl.remove(index);
        });
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

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    ionViewWillUnload() {
        this.removeSubscriptions();
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }
}