import { Component, NgZone, Inject, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { MeteorObservable } from "meteor-rxjs";
import { Observable, Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Element } from '../../../../../../../../both/models/points/establishment-point.model';

@Component({
    selector: 'cc-payment-confirm',
    templateUrl: './cc-payment-confirm.component.html',
    styleUrls: ['./cc-payment-confirm.component.scss'],
    providers: [UserLanguageService]
})
export class CcPaymentConfirmComponent implements OnInit, OnDestroy {

    private _cardNumber: string;
    private _totalPrice: number = 0;
    private _totalCurrency: string;

    /**
     * CcPaymentConfirmComponent Constructor
     * @param {MatDialogRef<any>} _dialogRef 
     * @param {NgZone} _zone 
     * @param {any} data 
     * @param {TranslateService} translate 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(public _dialogRef: MatDialogRef<any>,
        private _zone: NgZone,
        @Inject(MAT_DIALOG_DATA) public data: any,
        private translate: TranslateService,
        private _userLanguageService: UserLanguageService) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');

        this._cardNumber = this.data.cardnumber.substring(this.data.cardnumber.length - 4);

        this.data.establishmentarray.forEach((establishment) => {
            this._totalPrice = this._totalPrice + establishment.bagPlanPrice;
            if (establishment.creditPrice > 0) {
                this._totalPrice = this._totalPrice + establishment.creditPrice;
            }
            this._totalCurrency = establishment.bagPlanCurrency;
        });
    }

    ngOnInit() {
    }

    /**
     * Function to gets establishment name
     */
    getEstablishmentName(_establishmentId: string): string {
        let establishmentSelected: Establishment = Establishments.collection.findOne({ _id: _establishmentId });
        if (establishmentSelected) {
            return establishmentSelected.name
        }
    }

    /**
     * Function that returns true to Parent component
     */
    closeConfirm() {
        this._dialogRef.close({ success: true });
    }

    /**
     * This function allow closed the modal dialog
     */
    cancel() {
        this._dialogRef.close({ success: false });
    }

    ngOnDestroy() {

    }
}