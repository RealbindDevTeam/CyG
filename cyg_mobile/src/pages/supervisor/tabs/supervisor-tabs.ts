import { Component, OnInit, OnDestroy } from '@angular/core';
import { SupervisorApproveRewardsPage } from '../approve-rewards/supervisor-approve-rewards';
import { SettingsPage } from '../../customer/options/settings/settings';
import { SupervisorGiveMedalPage } from '../give-medal/supervisor-give-medal';

@Component({
    selector: 'supervisor-tabs',
    templateUrl: 'supervisor-tabs.html'
})
export class SupervisorTabsPage implements OnInit, OnDestroy {

    tabApproveRewardsPage: any = SupervisorApproveRewardsPage;
    tabSettings: any = SettingsPage;
    tabGiveMedalPage: any = SupervisorGiveMedalPage;

    constructor() {
    }

    ngOnInit(){
    }

    ngOnDestroy(){
    }
}