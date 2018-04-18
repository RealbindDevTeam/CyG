import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { NavController, NavParams, ToastController } from 'ionic-angular';
import { Subscription, Subject } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Addition } from 'cyg_web/both/models/menu/addition.model';
import { Additions } from 'cyg_web/both/collections/menu/addition.collection';
import { OrderAddition } from 'cyg_web/both/models/establishment/order.model';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';

@Component({
    selector: 'addition-establishment-page',
    templateUrl: 'additions-establishment.html'
})
export class AdditionsEstablishmentPage implements OnInit, OnDestroy {

    private _additionsSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _additions: any;
    private _establishmentId: string;

    /**
     * AdditionsPage constructor
     */
    constructor(public _navCtrl: NavController,
        public _navParams: NavParams,
        private _translate: TranslateService,
        private _toastCtrl: ToastController,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone) {
        _translate.setDefaultLang('en');
        this._establishmentId = this._navParams.get("res_id");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        this._additionsSub = MeteorObservable.subscribe('additionsByEstablishment', this._establishmentId).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({ 'establishments.establishment_id': { $in: [this._establishmentId] }, is_active: true }).zone();
            });
        });
    }

    /**
     * Return addition information
     * @param {Addition} _pAddition
     */
    getAdditionInformation(_pAddition: Addition): string {
        return _pAddition.name + ' - ' + _pAddition.establishments.filter(r => r.establishment_id === this._establishmentId)[0].price + ' ';
    }

    /**
     * Return traduction
     * @param {string} itemName 
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy implementation
     */
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