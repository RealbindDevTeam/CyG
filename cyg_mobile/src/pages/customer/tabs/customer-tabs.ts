import { Component, OnInit, OnDestroy } from '@angular/core';
import { HomePage } from "../home/home";
import { EstablishmentListPage } from '../establishment-list/establishment-list';
import { OptionsPage } from '../options/options';

@Component({
    selector: 'customer-tabs',
    templateUrl: 'customer-tabs.html'
})
export class CustomerTabsPage implements OnInit, OnDestroy {

    tabHome: any = HomePage;
    tabEstablishments: any = EstablishmentListPage;
    tabOptions: any = OptionsPage;

    constructor() {
    }

    ngOnInit() {
    }

    ngOnDestroy() {
    }
}