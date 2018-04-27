import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription, Observable, Subject } from 'rxjs';
import { NavParams, NavController, AlertController, Platform } from 'ionic-angular';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { MeteorObservable } from 'meteor-rxjs';
import { Reward } from 'cyg_web/both/models/establishment/reward.model';
import { Rewards } from 'cyg_web/both/collections/establishment/reward.collection';
import { Item, ItemImage } from 'cyg_web/both/models/menu/item.model';
import { Items } from 'cyg_web/both/collections/menu/item.collection';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'rewards-info',
    templateUrl: 'rewards-info.html'
})
export class RewardsInfoPage implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _itemsSub: Subscription;
    private _rewardsSub: Subscription;
    private disconnectSubscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _items: Observable<Item[]>;
    private _rewards: Observable<Reward[]>;

    private _establishmentId: string;
    private _thereRewards: boolean = true;

    /**
     * RewardsInfoPage Constructor
     * @param {TranslateService} _translate 
     * @param {NavParams} _navParams 
     * @param {NavController} _navCtrl 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone 
     * @param {AlertController} alertCtrl 
     * @param {Platform} _platform 
     * @param {Network} _network 
     */
    constructor(public _translate: TranslateService,
        public _navParams: NavParams,
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
                        this._thereRewards = true;
                    } else {
                        this._thereRewards = false;
                    }
                });
            });
        });
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

    /**
     * ionViewWillLeave implementation
     */
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