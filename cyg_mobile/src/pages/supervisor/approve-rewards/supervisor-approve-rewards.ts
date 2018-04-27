import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Select, AlertController, ToastController, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { Establishment } from 'cyg_web/both/models/establishment/establishment.model';
import { Establishments } from 'cyg_web/both/collections/establishment/establishment.collection';
import { RewardConfirmation } from 'cyg_web/both/models/points/reward-confirmation.model';
import { RewardsConfirmations } from 'cyg_web/both/collections/points/reward-confirmation.collection';
import { Reward } from 'cyg_web/both/models/establishment/reward.model';
import { Rewards } from 'cyg_web/both/collections/establishment/reward.collection';
import { User } from 'cyg_web/both/models/auth/user.model';
import { Users } from 'cyg_web/both/collections/auth/user.collection';
import { Item } from 'cyg_web/both/models/menu/item.model';
import { Items } from 'cyg_web/both/collections/menu/item.collection';
import { UserDetail, UserDetailImage } from 'cyg_web/both/models/auth/user-detail.model';
import { UserDetails } from 'cyg_web/both/collections/auth/user-detail.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'supervisor-approve-rewards',
    templateUrl: 'supervisor-approve-rewards.html'
})
export class SupervisorApproveRewardsPage implements OnInit, OnDestroy {

    @ViewChild('select1') select1: Select;

    private _user = Meteor.userId();
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _rewardSub: Subscription;
    private _establishmentSub: Subscription;
    private _rewardsConfirmationSub: Subscription;
    private _itemsSub: Subscription;
    private _usersSub: Subscription;
    private _userDetailsSub: Subscription;
    private disconnectSubscription: Subscription;

    private _establishments: Observable<Establishment[]>;
    private _rewardsConfirmations: Observable<RewardConfirmation[]>;
    private _rewards: Observable<Reward[]>;
    private _items: Observable<Item[]>;

    private _userFilter: string = "";
    private _establishmentFilter: string = "";

    /**
     * SupervisorApproveRewardsPage Constructor
     * @param {NgZone} _ngZone 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {TranslateService} _translate 
     * @param {AlertController} _alertCtrl 
     * @param {ToastController} toastCtrl 
     * @param {Platform} _platform 
     * @param {Network} _network 
     */
    constructor(private _ngZone: NgZone,
        private _userLanguageService: UserLanguageServiceProvider,
        public _translate: TranslateService,
        public _alertCtrl: AlertController,
        public toastCtrl: ToastController,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
        this._establishmentFilter = this.itemNameTraduction('MOBILE.SECTIONS.SELECTION');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        let _establishmentWorkId: string;
        this._usersSub = MeteorObservable.subscribe('getUsers').takeUntil(this._ngUnsubscribe).subscribe();
        this._userDetailsSub = MeteorObservable.subscribe('getUsersDetails').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                _establishmentWorkId = UserDetails.findOne({ user_id: this._user }).establishment_work;
                this._establishmentSub = MeteorObservable.subscribe('getEstablishmentByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._establishments = Establishments.find({ _id: _establishmentWorkId }).zone();
                        this._rewardsConfirmationSub = MeteorObservable.subscribe('getRewardsConfirmationsByEstablishmentsIds', [_establishmentWorkId]).takeUntil(this._ngUnsubscribe).subscribe();
                    });
                });
            });
        });
        this._rewardSub = MeteorObservable.subscribe('getRewardsByEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._rewards = Rewards.find({ establishments: { $in: [_establishmentWorkId] } }).zone();
            });
        });
        this._itemsSub = MeteorObservable.subscribe('getItemsByUserEstablishmentWork', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({ 'establishments.establishment_id': { $in: [_establishmentWorkId] }, is_active: true }).zone();
            });
        });
    }

    /**
     * This function allow translate strings
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
     * ionViewWillLeave implementation
     */
    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * Do filter by username or email address
     */
    doFilter() {
        this._rewardsConfirmations = null;
        if (this._establishmentFilter !== this.itemNameTraduction('MOBILE.SECTIONS.SELECTION')) {
            if (this._userFilter) {
                MeteorObservable.call('findUsers', this._userFilter).subscribe((userIds) => {
                    if (userIds) {
                        this._rewardsConfirmations = RewardsConfirmations.find({
                            establishment_id: this._establishmentFilter,
                            creation_user: { $in: userIds },
                            is_confirmed: false
                        }).zone();
                    }
                });
            }
        } else {
            this.presentAlert('', this.itemNameTraduction('APPROVE_REWARDS.MSG_SELECT_EST'), this.itemNameTraduction('MOBILE.OK'));
        }
    }

    /**
     * Return user image
     * @param {string} _pUserId 
     */
    getUserImage(_pUserId: string): string {
        let _lUser: User = Users.findOne({ _id: _pUserId });
        if (_lUser) {
            if (_lUser.services) {
                if (_lUser.services.facebook) {
                    return "http://graph.facebook.com/" + _lUser.services.facebook.id + "/picture/?type=large";
                } else {
                    let _lUserDetail: UserDetail = UserDetails.findOne({ user_id: _pUserId });
                    if (_lUserDetail) {
                        let _lUserDetailImage: UserDetailImage = _lUserDetail.image;
                        if (_lUserDetailImage) {
                            return _lUserDetailImage.url;
                        } else {
                            return 'assets/img/user_default_image.png';
                        }
                    }
                    else {
                        return 'assets/img/user_default_image.png';
                    }
                }
            } else {
                return 'assets/img/user_default_image.png';
            }
        } else {
            return 'assets/img/user_default_image.png';
        }
    }

    /**
     * Return user name
     * @param {string} _pUserId 
     */
    getUserName(_pUserId: string): string {
        let _lUser: User = Users.findOne({ _id: _pUserId });
        if (_lUser) {
            if (_lUser.username) {
                return _lUser.username;
            } else {
                if (_lUser.services) {
                    if (_lUser.services.facebook) {
                        return _lUser.services.facebook.name;
                    }
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
                    text: _pBtn
                }
            ]
        });
        alert.present();
    }

    /**
     * Function to disapprove reward confirmation
     * @param {RewardConfirmation} _pRewardConfirmation 
     */
    disapproveRewardConfirmation(_pRewardConfirmation: RewardConfirmation): void {
        let _lDialogTitle = this.itemNameTraduction('APPROVE_REWARDS.REJECT_REWARD');
        let _lDialogContent = this.itemNameTraduction('APPROVE_REWARDS.REJECT_REWARD_MSG');
        let _lError: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        let confirm = this._alertCtrl.create({
            title: _lDialogTitle,
            message: _lDialogContent,
            buttons: [
                {
                    text: this.itemNameTraduction('MOBILE.CANCEL'),
                    handler: () => {

                    }
                },
                {
                    text: this.itemNameTraduction('APPROVE_REWARDS.NO_APPROVE'),
                    handler: () => {
                        RewardsConfirmations.remove({ _id: _pRewardConfirmation._id });
                        let _lMessage = this.itemNameTraduction('APPROVE_REWARDS.REWARD_REJECTED');
                        this.presentToast(_lMessage);
                    }
                }
            ]
        });
        confirm.present();
    }

    /**
     * Function to approve reward confirmation 
     * @param {RewardConfirmation} _pRewardConfirmation 
     */
    approveRewardConfirmation(_pRewardConfirmation: RewardConfirmation): void {
        let _lDialogTitle = this.itemNameTraduction('APPROVE_REWARDS.APPROVE_REWARD');
        let _lDialogContent = this.itemNameTraduction('APPROVE_REWARDS.APPROVE_REWARD_MSG');
        let _lError: string = 'LOGIN_SYSTEM_OPERATIONS_MSG';

        let confirm = this._alertCtrl.create({
            title: _lDialogTitle,
            message: _lDialogContent,
            buttons: [
                {
                    text: this.itemNameTraduction('MOBILE.CANCEL'),
                    handler: () => {

                    }
                },
                {
                    text: this.itemNameTraduction('APPROVE_REWARDS.APPROVE'),
                    handler: () => {
                        MeteorObservable.call('redeemUserMedals', _pRewardConfirmation).subscribe(() => {
                            let _lMessage = this.itemNameTraduction('APPROVE_REWARDS.REWARD_APPROVED');
                            this.presentToast(_lMessage);
                        }, (error) => {
                            this.presentToast(error);
                        });
                    }
                }
            ]
        });
        confirm.present();
    }

    presentToast(_pMessage: string) {
        let toast = this.toastCtrl.create({
            position: 'middle',
            message: _pMessage,
            duration: 3000
        });
        toast.present();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    ngOnDestroy() {
        this.removeSubscriptions();
    }
}