import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { ViewController, NavParams, ToastController, LoadingController, NavController, AlertController, Platform } from 'ionic-angular';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { MeteorObservable } from 'meteor-rxjs';
import { Reward } from 'cyg_web/both/models/establishment/reward.model';
import { Rewards } from 'cyg_web/both/collections/establishment/reward.collection';
import { Item, ItemImage } from 'cyg_web/both/models/menu/item.model';
import { Items } from 'cyg_web/both/collections/menu/item.collection';
import { EstablishmentMedal } from 'cyg_web/both/models/points/establishment-medal.model';
import { EstablishmentMedals } from 'cyg_web/both/collections/points/establishment-medal.collection';
import { RewardConfirmation } from 'cyg_web/both/models/points/reward-confirmation.model';
import { RewardsConfirmations } from 'cyg_web/both/collections/points/reward-confirmation.collection';
import { Network } from '@ionic-native/network';

@Component({
    templateUrl: 'reward-list.html',
    selector: 'reward-list'
})
export class RewardListComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _itemsSub: Subscription;
    private _rewardsSub: Subscription;
    private _establishmentMedalSub: Subscription;
    private _rewardsConfirmationSub: Subscription;
    private disconnectSubscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _items: Observable<Item[]>;
    private _rewards: Observable<Reward[]>;
    private _establishmentMedals: Observable<EstablishmentMedal[]>;
    private _rewardsConfirmations: Observable<RewardConfirmation[]>;

    private _establishmentId: string;
    private _thereRewards: boolean = true;
    private _medalsInProcessToRedeem: number = 0;
    private _showMedalsInProcessToRedeem: boolean = false;
    private _medalsAvailableToRedeem: number = 0;
    private _establishmentIsActive: boolean = true;
    private _hiddenDiv: boolean = false;

    /**
     * RewardListComponent Constructor
     * @param {ViewController} viewCtrl 
     * @param {TranslateService} _translate 
     * @param {NavParams} _navParams 
     * @param {ToastController} toastCtrl 
     * @param {LoadingController} _loadingCtrl 
     * @param {NavController} _navCtrl 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone 
     * @param {AlertController} alertCtrl 
     * @param {Platform} _platform 
     * @param {Network} _network 
     */
    constructor(public viewCtrl: ViewController,
        public _translate: TranslateService,
        public _navParams: NavParams,
        private toastCtrl: ToastController,
        public _loadingCtrl: LoadingController,
        public _navCtrl: NavController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        public alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._establishmentId = this._navParams.get("establishment");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();

        this._establishmentMedalSub = MeteorObservable.subscribe('getEstablishmentMedalsByUserId', this._user).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentMedals = EstablishmentMedals.find({ user_id: this._user, establishment_id: this._establishmentId }).zone();
                this._establishmentMedals.subscribe(() => {
                    this.verifyEstablishment();
                    this._medalsAvailableToRedeem = 0;
                    this.validateMedalsAvailableToRedeem();
                });
            });
        });

        this._rewardsConfirmationSub = MeteorObservable.subscribe('getRewardsConfirmationsByEstablishmentId', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._rewardsConfirmations = RewardsConfirmations.find({ establishment_id: this._establishmentId, user_id: this._user, is_confirmed: false }).zone();
                this._rewardsConfirmations.subscribe(() => {
                    this.verifyRewardsConfirmations();
                    this._medalsInProcessToRedeem = 0;
                    this.verifyMedalsInProcessToRedeem();
                    this._medalsAvailableToRedeem = 0;
                    this.validateMedalsAvailableToRedeem();
                });
            });
        });

        this._itemsSub = MeteorObservable.subscribe('itemsByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({ 'establishments.establishment_id': { $in: [this._establishmentId] }, is_active: true }).zone();
            });
        });

        this._rewardsSub = MeteorObservable.subscribe('getEstablishmentRewards', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ establishments: { $in: [this._establishmentId] } }, { sort: { points: 1 } }).zone();
                this._rewards.subscribe(() => {
                    let count = Rewards.collection.find({ establishments: { $in: [this._establishmentId] } }, { sort: { points: 1 } }).count();
                    if (count > 0) {
                        this._thereRewards = false;
                    } else {
                        this._thereRewards = true;
                    }
                });
            });
        });
    }

    /**
     * Function to verify establishment status
     */
    verifyEstablishment(): void {
        let _lEstablishmentMedal: EstablishmentMedal = EstablishmentMedals.findOne({ user_id: this._user, establishment_id: this._establishmentId });
        if (_lEstablishmentMedal) {
            _lEstablishmentMedal.is_active ? this._establishmentIsActive = true : this._establishmentIsActive = false;
        }
    }

    /**
     * Verify rewards confirmation
     */
    verifyRewardsConfirmations(): void {
        RewardsConfirmations.collection.find({ establishment_id: this._establishmentId, user_id: this._user, is_confirmed: false }).count() > 0 ? this._showMedalsInProcessToRedeem = true : this._showMedalsInProcessToRedeem = false;
    }

    /**
     * Function to verify medals in process to redeem
     */
    verifyMedalsInProcessToRedeem(): void {
        RewardsConfirmations.collection.find({ establishment_id: this._establishmentId, user_id: this._user, is_confirmed: false }).fetch().forEach((rc) => {
            this._medalsInProcessToRedeem += rc.medals_to_redeem;
        });
    }

    /**
     * Function to validate medals available to redeem
     */
    validateMedalsAvailableToRedeem(): void {
        let _lEstablishmentMedal: EstablishmentMedal = EstablishmentMedals.findOne({ user_id: this._user, establishment_id: this._establishmentId });
        if (_lEstablishmentMedal) {
            this._medalsAvailableToRedeem = _lEstablishmentMedal.medals - this._medalsInProcessToRedeem;
        }
    }

    /**This function gets the item image or default
     * @param {string} _itemId
     * @return {string}
     */
    getItemThumb(_itemId: string): string {
        let item: Item;
        item = Items.findOne({ _id: _itemId });
        if (item) {
            if (item.image) {
                return item.image.url;
            } else {
                return 'assets/img/default-plate.png';
            }
        }
    }

    /**
     * this function gets the item name
     * @param {string} _itemId
     * @return {string}
     */
    getItemName(_itemId: string): string {
        let item: Item;
        item = Items.findOne({ _id: _itemId });
        if (item) {
            return item.name;
        }
    }

    /**
     * This function verify if user can redeem the reward
     */
    isValidRewardPoints(_rewardPts: number): boolean {
        if (this._medalsAvailableToRedeem >= _rewardPts) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Validate item id
     * @param {string} _itemId 
     */
    showReward(_itemId: string) {
        let item: Item = Items.findOne({ _id: _itemId });
        if (item) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * User redeem reward
     * @param {string} _pRewardId
     * @param {number} _pRewardPoints
     */
    redeemReward(_pRewardId: string, _pRewardPoints: number): void {
        let dialog_title = this.itemNameTraduction('MOBILE.REWARD_LIST.REWARD_CONFIRM_TITLE');
        let dialog_subtitle = this.itemNameTraduction('MOBILE.REWARD_LIST.REWARD_CONFIRM_SUBTITLE');
        let dialog_cancel_btn = this.itemNameTraduction('MOBILE.REWARD_LIST.NO');
        let dialog_accept_btn = this.itemNameTraduction('MOBILE.REWARD_LIST.YES');

        let alertConfirm = this.alertCtrl.create({
            title: dialog_title,
            message: dialog_subtitle,
            buttons: [
                {
                    text: dialog_cancel_btn,
                    role: 'cancel',
                    handler: () => {
                    }
                },
                {
                    text: dialog_accept_btn,
                    handler: () => {
                        RewardsConfirmations.insert({
                            creation_user: this._user,
                            creation_date: new Date(),
                            establishment_id: this._establishmentId,
                            user_id: this._user,
                            reward_id: _pRewardId,
                            medals_to_redeem: _pRewardPoints,
                            is_confirmed: false
                        });
                        this.presentToast();
                    }
                }
            ]
        });
        alertConfirm.present();
    }

    /**
     * This function present the toast to add the reward to de order
     */
    presentToast() {
        let _lMessage: string = this.itemNameTraduction('MOBILE.REWARD_LIST.REWARD_IN_PROCESS');
        let toast = this.toastCtrl.create({
            message: _lMessage,
            duration: 1500,
            position: 'middle'
        });
        toast.onDidDismiss(() => {
        });
        toast.present();
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


    hiddenDiv(){
        this._hiddenDiv = true;
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}