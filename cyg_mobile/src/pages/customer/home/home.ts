import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams, PopoverController, AlertController, Platform, ViewController } from 'ionic-angular';
import { RewardsPage } from '../rewards/rewards';
import { EstablishmentListPage } from "../establishment-list/establishment-list";
import { MedalWonPage } from '../medal-won/medal-won';
import { Network } from '@ionic-native/network';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Establishment } from 'cyg_web/both/models/establishment/establishment.model';
import { EstablishmentQR } from 'cyg_web/both/models/establishment/establishment-qr.model';
import { EstablishmentQRs } from 'cyg_web/both/collections/establishment/establishment-qr.collection';
import { Users } from 'cyg_web/both/collections/auth/user.collection';
import { UserDetails } from 'cyg_web/both/collections/auth/user-detail.collection';
import { UserDetail, UserDetailImage } from 'cyg_web/both/models/auth/user-detail.model';
import { User } from 'cyg_web/both/models/auth/user.model';

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage implements OnInit, OnDestroy {

    private _userSub: Subscription;
    private _userDetailSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private disconnectSubscription: Subscription;

    private _users: Observable<User[]>;

    /**
     * HomePage constructor
     * @param {NavController} _navCtrl 
     * @param {ViewController} _viewCtrl 
     * @param {PopoverController} popoverCtrl 
     * @param {AlertController} _alertCtrl 
     * @param {Platform} _platform 
     * @param {Network} _network 
     * @param {TranslateService} translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {BarcodeScanner} barcodeScanner 
     * @param {NgZone} _ngZone
     */
    constructor(public _navCtrl: NavController,
        private _viewCtrl: ViewController,
        public popoverCtrl: PopoverController,
        public _alertCtrl: AlertController,
        public _platform: Platform,
        private _network: Network,
        public translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        private barcodeScanner: BarcodeScanner,
        private _ngZone: NgZone) {
        translate.setDefaultLang('en');
    }

    /**
    * ngOnInit implementation
    */
    ngOnInit() {
        this.translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._userSub = MeteorObservable.subscribe('getUserByUserId', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._users = Users.find({ _id: Meteor.userId() }).zone();
                this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
            });
        });
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
     * Return user email
     * @param {string} _pUserId 
     */
    getUserEmail(_pUserId: string): string {
        let _lUser: User = Users.findOne({ _id: _pUserId });
        if (_lUser) {
            if (_lUser.emails) {
                return _lUser.emails[0].address;
            } else {
                if (_lUser.services) {
                    if (_lUser.services.facebook) {
                        return _lUser.services.facebook.email;
                    }
                }
            }
        }
    }
    
    /**
     * Function to go to establishments 
     */
    goToEstablishmentList() {
        this._navCtrl.push(EstablishmentListPage);
    }

    /**
     * Go to scan code page
     */
    goToScanCode() {
        this.barcodeScanner.scan().then((result) => {
            this.validateQRCode(result.text);
        }, (err) => {
            this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.ERROR'));
        });
    }

    /**
     * Function to validate QR Code
     * @param {string} _pQRCode 
     */
    validateQRCode(_pQRCode: string): void {
        var split = _pQRCode.split('/qr?', 2);
        var qr_code: string = split[1];
        qr_code = qr_code.replace('\0', '');
        MeteorObservable.call('verifyEstablishmentQRCode', qr_code).subscribe((establishmentQR: EstablishmentQR) => {
            if (establishmentQR) {
                if (establishmentQR.is_active) {
                    this.fordwardToMedalWon(qr_code);
                } else {
                    this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.QR_NO_ACTIVE'));
                }
            } else {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.QR_NO_EXISTS'));
            }
        });
    }

    /**
     * Fordward to medal won page when user accumlate a new medal
     * @param {string} _pQRCode 
     */
    fordwardToMedalWon(_pQRCode: string): void {
        MeteorObservable.call('getEstablishmentByQRCode', _pQRCode, Meteor.userId()).subscribe((establishment: Establishment) => {
            if (establishment) {
                this._navCtrl.push(MedalWonPage, { est_id: establishment._id });
            } else {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.ERROR'));
            }
        }, (error) => {
            if (error.error === '400') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.QR_NO_EXISTS'));
            } else if (error.error === '300') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.RESTAURANT_NOT_EXISTS'));
            } else if (error.error === '200') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.CYG_NO_ACTIVE'));
            } else if (error.error === '500') {
                this.showConfirmMessage(this.itemNameTraduction('MOBILE.SCAN_CODE.PENALTY') + error.reason);
            }
        });
    }

    /**
     * Show message confirm
     * @param _pContent 
     */
    showConfirmMessage(_pContent: any) {
        let okBtn = this.itemNameTraduction('MOBILE.OK');
        let title = this.itemNameTraduction('MOBILE.SYSTEM_MSG');

        let prompt = this._alertCtrl.create({
            title: title,
            message: _pContent,
            buttons: [
                {
                    text: okBtn,
                    handler: data => {
                    }
                }
            ]
        });
        prompt.present();
    }

    /**
     * Function to go rewards page
     */
    goToRewards() {
        this._navCtrl.push(RewardsPage);
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
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    ionViewWillLeave() {
        this.disconnectSubscription.unsubscribe();
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}