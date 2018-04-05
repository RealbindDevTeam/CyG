import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController, ViewController, Platform } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { Meteor } from 'meteor/meteor';
import { MeteorObservable } from 'meteor-rxjs';
import { Establishment } from 'cyg_web/both/models/establishment/establishment.model';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { BarcodeScanner } from '@ionic-native/barcode-scanner';
import { Network } from '@ionic-native/network';
import { Subscription } from 'rxjs/Subscription';

@Component({
    selector: 'scan-code',
    templateUrl: 'scan-code.html'
})
export class ScanCodePage implements OnInit {

    private disconnectSubscription: Subscription;

    /**
     * ScanCodePage Constructor
     * @param {NavController} _navCtrl 
     * @param {ViewController} _viewCtrl 
     * @param {TranslateService} _translate 
     * @param {AlertController} _alertCtrl 
     * @param {LoadingController} _loadingCtrl 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {BarcodeScanner} barcodeScanner 
     * @param {Platform} _platform 
     * @param {Network} _network 
     */
    constructor(private _navCtrl: NavController,
        private _viewCtrl: ViewController,
        public _translate: TranslateService,
        public _alertCtrl: AlertController,
        public _loadingCtrl: LoadingController,
        private _userLanguageService: UserLanguageServiceProvider,
        private barcodeScanner: BarcodeScanner,
        public _platform: Platform,
        private _network: Network) {
        _translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    }

    /**
     * Function to scan QR Code
     */
    scanQRCode(): void {
        this.barcodeScanner.scan().then((result) => {
            this.validateQRCode(result.text);
        }, (err) => {
            // An error occurred
        });
    }

    /**
     * Function to validate QR Code
     * @param {string} _pQRCode 
     */
    validateQRCode(_pQRCode: string): void {
        var split = _pQRCode.split('qr?', 2);
        var qr_code: string = split[1];
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

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }
}