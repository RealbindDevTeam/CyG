import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { App, NavController, NavParams, AlertController, Platform, LoadingController } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { UserLanguageServiceProvider } from '../../../providers/user-language-service/user-language-service';
import { Parameter } from 'cyg_web/both/models/general/parameter.model';
import { Parameters } from 'cyg_web/both/collections/general/parameter.collection';
import { SettingsPage } from './settings/settings';
import { RewardsHistoryPage } from './rewards-history/rewards-history';
import { InitialComponent } from '../../auth/initial/initial';

@Component({
    selector: 'options',
    templateUrl: 'options.html'
})
export class OptionsPage implements OnInit, OnDestroy {

    private _parameterSub: Subscription;
    private disconnectSubscription: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    /**
     * OptionsPage Constructor
     * @param {NavController} _navCtrl 
     * @param {AlertController} _alertCtrl 
     * @param {Platform} _platform 
     * @param {Network} _network 
     * @param {TranslateService} translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NgZone} _ngZone 
     */
    constructor(public _navCtrl: NavController,
        public _app: App,
        public _alertCtrl: AlertController,
        public _platform: Platform,
        public translate: TranslateService,
        public _loadingCtrl: LoadingController,
        private _network: Network,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone,
        private iab: InAppBrowser) {
        translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Go to settings page
     */
    goToSettings() {
        this._navCtrl.push(SettingsPage);
    }

    /**
     * Go to rewards history
     */
    goToRewardsHistory() {
        this._navCtrl.push(RewardsHistoryPage);
    }

    /**
     * go to term page
     */
    goToTerms() {
        let param: Parameter = Parameters.findOne({ name: 'terms_url' });
        const browser = this.iab.create(param.value);
    }

    /**
     * Go to policy page
     */
    goToPolicy() {
        let param: Parameter = Parameters.findOne({ name: 'policy_url' });
        const browser = this.iab.create(param.value);
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

    /**
     * Traduction function
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this.translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
   * This function show the confirm dialog to sign out from the app
   */
    showComfirmSignOut() {
        let btn_no = this.itemNameTraduction('MOBILE.SIGN_OUT.NO_BTN');
        let btn_yes = this.itemNameTraduction('MOBILE.SIGN_OUT.YES_BTN');
        let title = this.itemNameTraduction('MOBILE.SIGN_OUT.TITLE_CONFIRM');
        let content = this.itemNameTraduction('MOBILE.SIGN_OUT.CONTENT_CONFIRM');

        let prompt = this._alertCtrl.create({
            title: title,
            message: content,
            buttons: [
                {
                    text: btn_no,
                    handler: data => {
                    }
                },
                {
                    text: btn_yes,
                    handler: data => {
                        this.signOut();
                    }
                }
            ]
        });
        prompt.present();
    }

    /**
   * User account sign out
   */
    signOut() {
        let loading_msg = this.itemNameTraduction('MOBILE.SIGN_OUT.LOADING');
        let loading = this._loadingCtrl.create({ content: loading_msg });
        loading.present();
        setTimeout(() => {
            loading.dismiss();
            Meteor.logout();
            //this._navCtrl.pop();
            this._app.getRootNavs()[0].setRoot(InitialComponent);
        }, 1500);
    }

    /**
     * ionViewWillLeave implementation
     */
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
     * ngOnDestroy implemetation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}