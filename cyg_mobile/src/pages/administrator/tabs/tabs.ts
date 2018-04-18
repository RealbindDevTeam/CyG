import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApproveRewardsPage } from '../approve-rewards/approve-rewards';
import { SettingsPage } from '../../customer/home/popover-options/settings/settings';
import { GiveMedalPage } from '../../administrator/give-medal/give-medal';

@Component({
    selector: 'administrator-tabs',
    templateUrl: 'tabs.html'
})
export class TabsPage implements OnInit, OnDestroy {

    tabApproveRewardsPage: any = ApproveRewardsPage;
    tabSettings: any = SettingsPage;
    tabGiveMedal: any = GiveMedalPage;

    constructor() {
    }

    ngOnInit(){
    }

    ngOnDestroy(){
    }
}