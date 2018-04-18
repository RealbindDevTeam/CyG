import { Component, OnInit, OnDestroy, ViewChild, NgZone } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Select, AlertController, ToastController, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { Establishment } from 'cyg_web/both/models/establishment/establishment.model';
import { Establishments } from 'cyg_web/both/collections/establishment/establishment.collection';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { User } from 'cyg_web/both/models/auth/user.model';
import { Users } from 'cyg_web/both/collections/auth/user.collection';
import { UserDetail, UserDetailImage } from 'cyg_web/both/models/auth/user-detail.model';
import { UserDetails } from 'cyg_web/both/collections/auth/user-detail.collection';
import { Network } from '@ionic-native/network';

@Component({
    selector: 'give-medal',
    templateUrl: 'give-medal.html'
})
export class GiveMedalPage implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private _establishmentSub: Subscription;
    private _usersSub: Subscription;
    private _userDetailsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private disconnectSubscription: Subscription;

    private _establishments: Observable<Establishment[]>;
    private _users: Observable<User[]>;

    private _userFilter: string = "";
    private _establishmentFilter: string = "";

    /**
     * GiveMedalPage Constructor
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
        this._establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ creation_user: this._user }).zone();
                //this._establishments.subscribe(() => { this.countEstablishments(); });
            });
        });
        this._usersSub = MeteorObservable.subscribe('getUsers').takeUntil(this._ngUnsubscribe).subscribe();
        this._userDetailsSub = MeteorObservable.subscribe('getUsersDetails').takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Function to give medal to specific user
     * @param {string} _pUserId 
     */
    giveMedalToUser(_pUserId: string) {
        let _lDialogTitle = this.itemNameTraduction('GIVE_MEDAL.GIVE_MEDAL_TITLE');
        let _lDialogContent = this.itemNameTraduction('GIVE_MEDAL.GIVE_MEDAL_SUBTITLE') + this.getUserName(_pUserId);
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
                    text: this.itemNameTraduction('MOBILE.ACCEPT'),
                    handler: () => {
                        MeteorObservable.call('giveMedalToUser', this._establishmentFilter, _pUserId).subscribe(() => {
                            let _lMessage = this.itemNameTraduction('GIVE_MEDAL.MEDAL_GIVEN');
                            this._users = null;
                            this._establishmentFilter = '';
                            this._userFilter = '';
                            this.presentToast(_lMessage);
                        }, (error) => {
                            this._users = null;
                            this._establishmentFilter = '';
                            this._userFilter = '';
                            this.presentToast(error);
                        });
                    }
                }
            ]
        });
        confirm.present();
    }

    /**
     * Do filter by username or email address
     */
    doFilter() {
        this._users = null;
        let _lUserDetailsId: string[] = new Array();
        if (this._establishmentFilter !== this.itemNameTraduction('MOBILE.SECTIONS.SELECTION')) {
            if (this._userFilter) {
                MeteorObservable.call('findUsers', this._userFilter).subscribe((userIds) => {
                    if (userIds) {
                        UserDetails.collection.find({ user_id: { $in: userIds }, role_id: '400' }).fetch().forEach((us) => {
                            _lUserDetailsId.push(us.user_id);
                        });
                        this._users = Users.find({ _id: { $in: _lUserDetailsId } }).zone();
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
     * Present toast with message
     * @param {string} _pMessage 
     */
    presentToast(_pMessage: string) {
        let toast = this.toastCtrl.create({
            position: 'middle',
            message: _pMessage,
            duration: 3000
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
     * ionViewWillLeave implementation
     */
    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
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
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}