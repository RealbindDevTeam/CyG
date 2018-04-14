import { Component, OnInit, OnDestroy } from '@angular/core';
import { SupervisorApproveRewardsPage } from '../approve-rewards/supervisor-approve-rewards';
import { SettingsPage } from '../../customer/home/popover-options/settings/settings';


@Component({
    selector: 'supervisor-tabs',
    templateUrl: 'supervisor-tabs.html'
})
export class SupervisorTabsPage implements OnInit, OnDestroy {

    tabApproveRewardsPage: any = SupervisorApproveRewardsPage;
    tabSettings: any = SettingsPage;

    constructor() {
    }

    ngOnInit(){
    }

    ngOnDestroy(){
    }
}