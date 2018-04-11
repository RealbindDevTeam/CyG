import { Component, Input } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageServiceProvider } from '../../../../../providers/user-language-service/user-language-service';

@Component({
    selector: 'page-user-rewards',
    templateUrl: 'user-rewards.html'
})
export class UserRewardsPage {

    @Input()
    establishmentId: string;
}