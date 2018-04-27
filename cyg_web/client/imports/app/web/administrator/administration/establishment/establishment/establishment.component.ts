import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { Router } from "@angular/router";
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MatDialog, MatSnackBar } from '@angular/material';
import { Meteor } from 'meteor/meteor';
import { UserLanguageService } from '../../../../services/general/user-language.service';
import { Establishment } from '../../../../../../../../both/models/establishment/establishment.model';
import { Establishments } from '../../../../../../../../both/collections/establishment/establishment.collection';
import { Country } from '../../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../../both/collections/general/country.collection';
import { EstablishmentPoint } from '../../../../../../../../both/models/points/establishment-point.model';
import { EstablishmentPoints } from '../../../../../../../../both/collections/points/establishment-points.collection';
import { Parameters } from '../../../../../../../../both/collections/general/parameter.collection';
import { Parameter } from '../../../../../../../../both/models/general/parameter.model';
import { EstablishmentQR } from '../../../../../../../../both/models/establishment/establishment-qr.model';
import { EstablishmentQRs } from '../../../../../../../../both/collections/establishment/establishment-qr.collection';

let jsPDF = require('jspdf');

@Component({
    selector: 'establishment',
    templateUrl: './establishment.component.html',
    styleUrls: ['./establishment.component.scss']
})
export class EstablishmentComponent implements OnInit, OnDestroy {

    private _user = Meteor.userId();
    private establishments: Observable<Establishment[]>;

    private establishmentSub: Subscription;
    private _establishmentQRSub: Subscription;
    private countriesSub: Subscription;
    private _establishmentPointsSub: Subscription;
    private parameterSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();

    public _dialogRef: MatDialogRef<any>;
    private _thereAreEstablishments: boolean = true;

    /**
     * EstablishmentComponent Constructor
     * @param {Router} router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} translate 
     * @param {MatDialog} _dialog
     * @param {NgZone} _ngZone
     * @param {UserLanguageService} _userLanguageService
     * @param {MatSnackBar} _snackBar
     */
    constructor(private router: Router,
        private _formBuilder: FormBuilder,
        private translate: TranslateService,
        public _dialog: MatDialog,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService,
        private _snackBar: MatSnackBar) {
        translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        translate.setDefaultLang('en');
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSubscriptions();
        this.establishmentSub = MeteorObservable.subscribe('establishments', this._user).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _establishmentIds: string[] = [];
                this.establishments = Establishments.find({ creation_user: this._user }).zone();
                Establishments.collection.find({ creation_user: this._user }).fetch().forEach((establishment) => {
                    _establishmentIds.push(establishment._id);
                });
                this.countEstablishments();
                this.establishments.subscribe(() => { this.countEstablishments(); });
                this._establishmentPointsSub = MeteorObservable.subscribe('getEstablishmentPointsByIds', _establishmentIds).takeUntil(this._ngUnsubscribe).subscribe();
            });
        });
        this._establishmentQRSub = MeteorObservable.subscribe('getEstablishmentQRsByAdmin', this._user).takeUntil(this._ngUnsubscribe).subscribe();
        this.countriesSub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this.parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe();
    }

    /**
     * Validate if establishments exists
     */
    countEstablishments(): void {
        Establishments.collection.find({ creation_user: this._user }).count() > 0 ? this._thereAreEstablishments = true : this._thereAreEstablishments = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * Function to open EstablishmentRegisterComponent
     */
    openEstablishmentRegister() {
        this.router.navigate(['app/establishment-register']);
    }

    /**
     * Function to open EstablishmentEditionComponent
     * @param {Establishment} _establishment 
     */
    openEstablishmentEdition(_establishment: Establishment) {
        this.router.navigate(['app/establishment-edition', JSON.stringify(_establishment)], { skipLocationChange: true });
    }

    /**
     * Get Establishment Country
     * @param {string} _pCountryId
     */
    getEstablishmentCountry(_pCountryId: string): string {
        let _lCountry: Country = Countries.findOne({ _id: _pCountryId });
        if (_lCountry) {
            return _lCountry.name;
        }
    }

    /**
     * Get Establishment Points
     * @param {string} _pEstablishmentId 
     */
    getEstablishmentPoints(_pEstablishmentId: string): number {
        let _establishmentPoint: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: _pEstablishmentId });
        if (_establishmentPoint) {
            return _establishmentPoint.current_points;
        } else {
            return 0;
        }
    }

    /**
     * Function to print establishment QR code
     * @param {string} _pEstablishmentName 
     */
    printQrPdf(_pEstablishmentId: string, _pEstablishmentName: string): void {
        let file_name = this.itemNameTraduction('RESTAURANT.QR_CODE');
        let iurest_url: string = Parameters.findOne({ name: 'iurest_url_short' }).value;
        let _lEstablishmentQR: EstablishmentQR = EstablishmentQRs.findOne({ establishment_id: _pEstablishmentId });
        let _establishmentName: string[] = [];

        if (_pEstablishmentName.length <= 28) {
            _establishmentName.push(_pEstablishmentName);
        } else {
            _establishmentName.push(_pEstablishmentName.substr(0, 28));
            _establishmentName.push(_pEstablishmentName.substr(28, 50));
        }

        if (_lEstablishmentQR) {
            let qr_pdf = new jsPDF("portrait", "mm", "a4");
            qr_pdf.setFontSize(16);
            qr_pdf.rect(55, 25, 90, 90);
            qr_pdf.text(60, 33, _establishmentName);
            if (_pEstablishmentName.length <= 28) {
                qr_pdf.addImage(_lEstablishmentQR.QR_URI, 'JPEG', 70, 37, 60, 60);
                qr_pdf.setFontSize(13);
                qr_pdf.text(77, 102, iurest_url);
            } else {
                qr_pdf.addImage(_lEstablishmentQR.QR_URI, 'JPEG', 70, 44, 60, 60);
                qr_pdf.setFontSize(13);
                qr_pdf.text(77, 109, iurest_url);
            }
            qr_pdf.output('save', _pEstablishmentName.substr(0, 15) + '_' + file_name + '.pdf');

            let _lMessage: string = this.itemNameTraduction('RESTAURANT.QR_CODE_DOWNLOADED');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
        } else {
            let _lMessage: string = this.itemNameTraduction('RESTAURANT.QR_CODE_ERROR');
            this._snackBar.open(_lMessage, '', { duration: 2500 });
        }
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(_itemName: string): string {
        var _wordTraduced: string;
        this.translate.get(_itemName).subscribe((res: string) => {
            _wordTraduced = res;
        });
        return _wordTraduced;
    }

    /**
     * ngOnDestroy implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}