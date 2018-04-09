import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { NavParams } from 'ionic-angular';
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';

@Component({
    templateUrl: 'points-detail.html'
})
export class PointsDetailPage {

    private _establishment_id: string;
    private _option: string = 'user_medals';

    /**
     * PointsDetailPage Constructor
     * @param {TranslateService} _translate 
     * @param {UserLanguageServiceProvider} _userLanguageService 
     * @param {NavParams} _navParams
     */
    constructor(private _translate: TranslateService,
        private _userLanguageService: UserLanguageServiceProvider,
        public _navParams: NavParams) {
        _translate.setDefaultLang('en');
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this._establishment_id = this._navParams.get("_establishment_id");
    }
}
