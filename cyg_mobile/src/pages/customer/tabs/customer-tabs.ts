import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomePage } from "../home/home";
import { SettingsPage } from '../../customer/home/popover-options/settings/settings';


@Component({
    selector: 'customer-tabs',
    templateUrl: 'customer-tabs.html'
})
export class CustomerTabsPage implements OnInit, OnDestroy {

    tabHome: any = HomePage;
    tabSettings: any = SettingsPage;

    constructor() {
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }
}