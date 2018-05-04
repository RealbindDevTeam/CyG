import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material';
import { MeteorObservable } from 'meteor-rxjs';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, Subject } from 'rxjs';
import { VerifyResultComponent } from './verify-result/verify-result.component';
import { UserLanguageService } from '../../../services/general/user-language.service';
import { PaymentsHistory } from '../../../../../../../both/collections/payment/payment-history.collection';
import { PaymentHistory } from '../../../../../../../both/models/payment/payment-history.model';
import { Establishments } from '../../../../../../../both/collections/establishment/establishment.collection';
import { Establishment } from '../../../../../../../both/models/establishment/establishment.model';
import { ResponseQuery, Merchant, Details } from '../../../../../../../both/models/payment/response-query.model';
import { PaymentTransactions } from '../../../../../../../both/collections/payment/payment-transaction.collection';
import { PaymentTransaction } from '../../../../../../../both/models/payment/payment-transaction.model';
import { AlertConfirmComponent } from '../../../../web/general/alert-confirm/alert-confirm.component';
import { Parameter } from '../../../../../../../both/models/general/parameter.model';
import { Parameters } from '../../../../../../../both/collections/general/parameter.collection';
import { UserDetail } from '../../../../../../../both/models/auth/user-detail.model';
import { UserDetails } from '../../../../../../../both/collections/auth/user-detail.collection';
import { Country } from '../../../../../../../both/models/general/country.model';
import { Countries } from '../../../../../../../both/collections/general/country.collection';
import { CygInvoices } from '../../../../../../../both/collections/payment/cyg-invoices.collection';
import { CygInvoice } from '../../../../../../../both/models/payment/cyg-invoice.model';
import { PayuPaymentService } from '../../../services/payment/payu-payment.service';
import { EstablishmentPoints } from '../../../../../../../both/collections/points/establishment-points.collection';
import { EstablishmentPoint } from '../../../../../../../both/models/points/establishment-point.model';
import { NegativePoints } from '../../../../../../../both/collections/points/negative-points.collection';
import { EstablishmentMedals } from '../../../../../../../both/collections/points/establishment-medal.collection';
import { EstablishmentMedal } from '../../../../../../../both/models/points/establishment-medal.model';

let jsPDF = require('jspdf');

@Component({
    selector: 'payment-history',
    templateUrl: './payment-history.component.html',
    styleUrls: ['./payment-history.component.scss']
})
export class PaymentHistoryComponent implements OnInit, OnDestroy {

    private _historyPaymentSub: Subscription;
    private _establishmentSub: Subscription;
    private _paymentTransactionSub: Subscription;
    private _parameterSub: Subscription;
    private _userDetailSub: Subscription;
    private _countrySub: Subscription;
    private _citySub: Subscription;
    private _iurestInvoiceSub: Subscription;
    private _ngUnsubscribe: Subject<void> = new Subject<void>();
    private _historyPayments: Observable<PaymentHistory[]>;
    private _historyPayments2: Observable<PaymentHistory[]>;
    private _paymentTransactions: Observable<PaymentTransaction[]>;
    private _selectedMonth: string;
    private _selectedYear: string;
    private _yearsArray: any[];
    private _monthsArray: any[];
    private _currentDate: Date;
    private _currentYear: number;
    private _activateMonth: boolean;
    private _loading: boolean;
    private _mdDialogRef: MatDialogRef<any>;
    private titleMsg: string;
    private btnAcceptLbl: string;
    private _thereArePaymentsHistory: boolean = true;
    private is_prod_flag: string;
    private isProd: boolean;
    private cygImage: string;
    private _negativePointsSub: Subscription;
    private _establishmentMedalsSub: Subscription;
    private _establishmentPointSub: Subscription;

    private _establishmentMedArra: Observable<EstablishmentMedal[]>;

    /**
     * PaymentHistoryComponent Constructor
     * @param {Router} _router 
     * @param {FormBuilder} _formBuilder 
     * @param {TranslateService} _translate 
     * @param {MatDialog} _mdDialog 
     * @param {PayuPaymenteService} _payuPaymentService 
     * @param {UserLanguageService} _userLanguageService 
     */
    constructor(private _translate: TranslateService,
        public _mdDialog: MatDialog,
        private _payuPaymentService: PayuPaymentService,
        private _ngZone: NgZone,
        private _userLanguageService: UserLanguageService) {
        _translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        _translate.setDefaultLang('en');

        this._currentDate = new Date();
        this._activateMonth = true;

        this.titleMsg = 'SIGNUP.SYSTEM_MSG';
        this.btnAcceptLbl = 'SIGNUP.ACCEPT';
    }

    /**
     * ngOnInit Implementation
     */
    ngOnInit() {
        this.removeSubscriptions();

        this._userDetailSub = MeteorObservable.subscribe('getUserDetailsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._countrySub = MeteorObservable.subscribe('countries').takeUntil(this._ngUnsubscribe).subscribe();
        this._historyPaymentSub = MeteorObservable.subscribe('getHistoryPaymentsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._historyPayments2 = PaymentsHistory.find({ creation_user: Meteor.userId() }).zone();
                this.countPaymentsHistory();
                this._historyPayments2.subscribe(() => { this.countPaymentsHistory(); });
                this._historyPayments = PaymentsHistory.find({
                    creation_user: Meteor.userId(),
                    creation_date: {
                        $gte: new Date(new Date().getFullYear(), 0, 1),
                        $lte: new Date(new Date().getFullYear(), 11, 31)
                    }
                },
                    { sort: { creation_date: -1 } }).zone();
            });
        });

        this._iurestInvoiceSub = MeteorObservable.subscribe('getCygInvoiceByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentSub = MeteorObservable.subscribe('establishments', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._paymentTransactionSub = MeteorObservable.subscribe('getTransactionsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentMedalsSub = MeteorObservable.subscribe('getEstablishmentByAdminUsr', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._negativePointsSub = MeteorObservable.subscribe('getNegativePointsByAdminUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._establishmentPointSub = MeteorObservable.subscribe('getEstablishmentPointsByUser', Meteor.userId()).takeUntil(this._ngUnsubscribe).subscribe();
        this._parameterSub = MeteorObservable.subscribe('getParameters').takeUntil(this._ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this.is_prod_flag = Parameters.findOne({ name: 'payu_is_prod' }).value;
                this.isProd = (this.is_prod_flag == 'true');
            });
        });

        this._currentYear = this._currentDate.getFullYear();
        this._yearsArray = [];
        this._yearsArray.push({ value: this._currentYear, viewValue: this._currentYear });

        for (let i = 1; i <= 2; i++) {
            let auxYear = { value: this._currentYear - i, viewValue: this._currentYear - i };
            this._yearsArray.push(auxYear);
        }

        this._monthsArray = [{ value: '01', viewValue: '01' }, { value: '02', viewValue: '02' }, { value: '03', viewValue: '03' },
        { value: '04', viewValue: '04' }, { value: '05', viewValue: '05' }, { value: '06', viewValue: '06' },
        { value: '07', viewValue: '07' }, { value: '08', viewValue: '08' }, { value: '09', viewValue: '09' },
        { value: '10', viewValue: '10' }, { value: '11', viewValue: '11' }, { value: '12', viewValue: '12' }];

        this.cygImage = '/images/logo_iurest.png';
    }

    /**
     * Validate if user payments history exists
     */
    countPaymentsHistory(): void {
        PaymentsHistory.collection.find({ creation_user: Meteor.userId() }).count() > 0 ? this._thereArePaymentsHistory = true : this._thereArePaymentsHistory = false;
    }

    /**
     * Remove all subscriptions
     */
    removeSubscriptions(): void {
        this._ngUnsubscribe.next();
        this._ngUnsubscribe.complete();
    }

    /**
     * This function enable month select component and update history payment query
     */
    changeHistoryPaymentYear() {
        let _selectedYearNum: number = Number(this._selectedYear);
        this._historyPayments = PaymentsHistory.find({
            creation_user: Meteor.userId(),
            creation_date: {
                $gte: new Date(_selectedYearNum, 0, 1),
                $lte: new Date(_selectedYearNum, 11, 31)
            }
        },
            { sort: { creation_date: -1 } }).zone();

        this._activateMonth = false;
        this._selectedMonth = "0";
    }

    /**
     * This function update history payment by month and year
     */
    changeHistoryPaymentMonth() {
        let _selectedMonthNum: number = Number(this._selectedMonth) - 1;
        let _selectedYearNum: number = Number(this._selectedYear);

        if (_selectedMonthNum === -1) {
            this._historyPayments = PaymentsHistory.find({
                creation_user: Meteor.userId(),
                creation_date: {
                    $gte: new Date(_selectedYearNum, 0, 1),
                    $lte: new Date(_selectedYearNum, 11, 31)
                }
            },
                { sort: { creation_date: -1 } }).zone();
        }
        else {
            this._historyPayments = PaymentsHistory.find({
                creation_user: Meteor.userId(),
                creation_date: {
                    $gte: new Date(_selectedYearNum, _selectedMonthNum, 1),
                    $lte: new Date(_selectedYearNum, _selectedMonthNum, 31)
                }
            },
                { sort: { creation_date: -1 } }).zone();
        }
    }

    /**
     * This function returns de status payment image 
     * @param {string} _status
     */
    getImageName(_status: string): string {
        let imgStr: string = '';
        switch (_status) {
            case 'TRANSACTION_STATUS.APPROVED': {
                imgStr = '/images/trn_approved.png';
                break;
            }
            case 'TRANSACTION_STATUS.DECLINED': {
                imgStr = '/images/trn_declined.png';
                break;
            }
            case 'TRANSACTION_STATUS.PENDING': {
                imgStr = '/images/trn_pending.png';
                break;
            }
            case 'TRANSACTION_STATUS.EXPIRED': {
                imgStr = '/images/trn_declined.png';
                break;
            }
            default: {
                imgStr = '/images/trn_declined.png';
                break;
            }
        }
        return imgStr;
    }

    /**
     * This function gets custPayInfo credentials
     */
    getPayInfo(_transactionId: string) {

        try {
            this.checkTransactionStatus(this._payuPaymentService.al, this._payuPaymentService.ak, _transactionId);
        } catch (e) {
            let errorMsg = this.itemNameTraduction('RES_PAYMENT_HISTORY.UNAVAILABLE_REPORT');
            this.openDialog(this.titleMsg, '', errorMsg, '', this.btnAcceptLbl, false);
            this._loading = false;
        }
    }

    /**
     * This function queries de transaction status
     * @param {string} _transactionId
     */
    checkTransactionStatus(al: string, ak: string, _transactionId: string) {
        let responseQuery = new ResponseQuery();
        let merchant = new Merchant();
        let details = new Details();
        let credentialArray: string[] = [];
        let responseMessage: string;
        let responseIcon: string;
        let payuReportsApiURI: string;

        let historyPayment = PaymentsHistory.collection.findOne({ paymentTransactionId: _transactionId });
        if (historyPayment) {
            let paymentTransaction = PaymentTransactions.collection.findOne({ _id: historyPayment.paymentTransactionId });
            if (paymentTransaction) {
                this._loading = true;
                setTimeout(() => {
                    responseQuery.language = Meteor.user().profile.language_code;
                    responseQuery.command = 'TRANSACTION_RESPONSE_DETAIL';
                    merchant.apiLogin = al;
                    merchant.apiKey = ak;
                    responseQuery.merchant = merchant;
                    details.transactionId = paymentTransaction.responsetransactionId;
                    responseQuery.details = details;
                    if (this.isProd) {
                        responseQuery.test = false;
                        payuReportsApiURI = Parameters.findOne({ name: 'payu_reports_url_prod' }).value;
                    } else {
                        responseQuery.test = true;
                        payuReportsApiURI = Parameters.findOne({ name: 'payu_reports_url_test' }).value;
                    }

                    this._payuPaymentService.getTransactionResponse(payuReportsApiURI, responseQuery).subscribe(
                        response => {
                            if (response.code === 'ERROR') {
                                responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_ERROR'
                                responseIcon = 'trn_declined.png';
                            } else if (response.code === 'SUCCESS') {
                                switch (response.result.payload.state) {
                                    case "APPROVED": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_APPROVED';
                                        responseIcon = 'trn_approved.png';
                                        break;
                                    }
                                    case "DECLINED": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_DECLINED';
                                        responseIcon = 'trn_declined.png';
                                        break;
                                    }
                                    case "PENDING": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_PENDING';
                                        responseIcon = 'trn_pending.png';
                                        break;
                                    }
                                    case "EXPIRED": {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_EXPIRED';
                                        responseIcon = 'trn_declined.png';
                                        break;
                                    }
                                    default: {
                                        this.updateAllStatus(historyPayment, paymentTransaction, response);
                                        responseMessage = 'RES_PAYMENT_HISTORY.VERIFY_ERROR';
                                        responseIcon = 'trn_declined.png';
                                        break;
                                    }
                                }
                            }
                            this._mdDialogRef = this._mdDialog.open(VerifyResultComponent, {
                                disableClose: true,
                                data: {
                                    responseStatus: responseMessage,
                                    responseImage: responseIcon
                                }
                            });

                            this._mdDialogRef.afterClosed().subscribe(result => {
                                this._mdDialogRef = result;
                                if (result.success) {

                                }
                            });
                        },
                        error => {
                            let errorMsg = this.itemNameTraduction('RES_PAYMENT_HISTORY.UNAVAILABLE_REPORT');
                            this.openDialog(this.titleMsg, '', errorMsg, '', this.btnAcceptLbl, false);
                            this._loading = false;
                        }
                    );
                    this._loading = false;
                }, 5000);
            }
        }
    }

    /**
     * This function updates the history Payment status, payment transaction status, establishment and tables
     * @param {string} _status
     * */
    updateAllStatus(_historyPayment: PaymentHistory, _paymentTransaction: PaymentTransaction, _response: any) {
        PaymentTransactions.collection.update({ _id: _paymentTransaction._id },
            {
                $set: {
                    status: _response.result.payload.state,
                    responseCode: _response.result.payload.responseCode,
                    modification_user: Meteor.userId(),
                    modification_date: new Date()
                }
            });

        PaymentsHistory.collection.update({ _id: _historyPayment._id },
            {
                $set: {
                    status: 'TRANSACTION_STATUS.' + _response.result.payload.state,
                    modification_user: Meteor.userId(),
                    modification_date: new Date()
                }
            });

        if (_response.result.payload.state == 'APPROVED') {
            _historyPayment.establishment_ids.forEach((establishment) => {
                let establishmentPoint: EstablishmentPoint = EstablishmentPoints.findOne({ establishment_id: establishment.establishmentId });
                let pointsToAdd: number = establishment.bagPlanPoints + establishment.creditPoints;

                EstablishmentPoints.update({ _id: establishmentPoint._id }, {
                    $set: {
                        current_points: establishmentPoint.current_points + pointsToAdd,
                        negative_balance: false,
                        negative_advice_counter: 0,
                        modification_user: Meteor.userId(),
                        modification_date: new Date()
                    }
                });

                NegativePoints.collection.find({ establishment_id: establishment.establishmentId, paid: false }).forEach(function <NegativePoint>(negativePoint, index, ar) {
                    NegativePoints.collection.update({ _id: negativePoint._id }, {
                        $set: {
                            paid: true,
                            bag_plans_history_id: _historyPayment._id,
                            modification_user: Meteor.userId(),
                            modification_date: new Date()
                        }
                    });
                });

                EstablishmentMedals.collection.find({ establishment_id: establishment.establishmentId }).forEach(function <EstablishmentMedal>(establishmentMedal, index, ar) {
                    EstablishmentMedals.collection.update({ _id: establishmentMedal._id }, {
                        $set: {
                            is_active: true,
                            modification_user: Meteor.userId(),
                            modification_date: new Date()
                        }
                    });
                });

                Establishments.collection.update({ _id: establishment.establishmentId }, {
                    $set: {
                        isActive: true,
                        modification_date: new Date(),
                        modification_user: Meteor.userId()
                    }
                });
            });

            //Call meteor method for generate iurest invoice
            MeteorObservable.call('generateInvoiceInfo', _historyPayment._id, Meteor.userId()).subscribe();
        }
    }

    /**
     * This functions gets de establishment name by id
     * @param {string }_establishmentId 
     */
    getEstablishmentName(_establishmentId: string): string {
        let establishment = Establishments.findOne({ _id: _establishmentId });
        if (establishment) {
            return establishment.name;
        } else {
            return '';
        }
    }

    /**
     * This function generates de invoice
     */
    generateInvoice(_paymentHistory: PaymentHistory) {
        let cyg_invoice: CygInvoice = CygInvoices.findOne({ payment_history_id: _paymentHistory._id });
        let invoice_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_LBL');
        let number_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.NUMBER_LBL');
        let date_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.DATE_LBL');
        let cc_payment_lbl = this.itemNameTraduction('PAYU_PAYMENT_FORM.CC_PAYMENT_METHOD');
        let customer_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.CUSTOMER_LBL');
        let desc_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.DESCRIPTION_LBL');
        let period_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.PERIOD_LBL');
        let amount_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.AMOUNT_LBL');
        let subtotal_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.SUBTOTAL');
        let iva_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.IVA');
        let total_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.TOTAL');
        let fileName = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE');
        let resolution_msg = this.itemNameTraduction('RES_PAYMENT_HISTORY.RESOLUTION_MSG');
        let res_from_date = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_START_DATE');
        let res_to_date = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_END_DATE');
        let res_from_value = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_START_VALUE');
        let res_to_value = this.itemNameTraduction('RES_PAYMENT_HISTORY.INVOICE_END_VALUE');
        let payment_method_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.PAYMENT_METHOD')
        let identication_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.IDENTIFICATION_NUMBER');
        let phone_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.TELEPHONE_NUMBER');
        let email_lbl = this.itemNameTraduction('RES_PAYMENT_HISTORY.EMAIL');
        let aux_payment_method = this.itemNameTraduction(cyg_invoice.payment_method);
        let aux_country = this.itemNameTraduction(cyg_invoice.client_info.country);
        let aux_description = this.itemNameTraduction(cyg_invoice.description);
        let package_of_medal = this.itemNameTraduction('RES_PAYMENT_HISTORY.PACKAGE_MEDALS');
        let pending_medals = this.itemNameTraduction('RES_PAYMENT_HISTORY.PENDING_MEDALS');
        let medals = this.itemNameTraduction('RES_PAYMENT_HISTORY.MEDALS');

        let initialHeight: number;
        initialHeight = this.calculateHeight(cyg_invoice);
        let y: number = 130;

        let qr_pdf = new jsPDF("p", "mm", [210, initialHeight]);
        var imgData = 'data:image/png;base64,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';

        qr_pdf.addImage(imgData, 'png', 15, 13, 52.916666667, 15.875);

        qr_pdf.setFontSize(10);
        qr_pdf.text(cyg_invoice.company_info.name, 195, 15, 'right');
        qr_pdf.text(cyg_invoice.company_info.address, 195, 20, 'right');
        qr_pdf.text(cyg_invoice.company_info.city + ', ' + cyg_invoice.company_info.country, 195, 25, 'right');
        qr_pdf.text(cyg_invoice.company_info.phone, 195, 30, 'right');
        qr_pdf.text(cyg_invoice.company_info.nit, 195, 35, 'right');
        qr_pdf.text(cyg_invoice.company_info.regime, 195, 40, 'right');
        qr_pdf.text(cyg_invoice.company_info.contribution, 195, 45, 'right');
        qr_pdf.text(cyg_invoice.company_info.retainer, 195, 50, 'right');
        qr_pdf.text(cyg_invoice.company_info.agent_retainter, 195, 55, 'right');
        qr_pdf.text(resolution_msg + ' ' + cyg_invoice.company_info.resolution_number, 195, 60, 'right');

        let from_date_formatted = cyg_invoice.company_info.resolution_start_date.getDate() + '/' +
            (cyg_invoice.company_info.resolution_start_date.getMonth() + 1) + '/' +
            cyg_invoice.company_info.resolution_start_date.getFullYear();
        let to_date_formatted = cyg_invoice.company_info.resolution_end_date.getDate() + '/' +
            (cyg_invoice.company_info.resolution_end_date.getMonth() + 1) + '/' +
            cyg_invoice.company_info.resolution_end_date.getFullYear();
        qr_pdf.text(res_from_date + ' ' + from_date_formatted + ' ' + res_to_date + ' ' + to_date_formatted, 195, 65, 'right');

        qr_pdf.text(res_from_value + ' ' + cyg_invoice.company_info.resolution_prefix + '-' + cyg_invoice.company_info.resolution_start_value + ' ' +
            res_to_value + ' ' + cyg_invoice.company_info.resolution_prefix + '-' + cyg_invoice.company_info.resolution_end_value, 195, 70, 'right');

        qr_pdf.setFontSize(12);
        qr_pdf.setFontStyle('bold');
        qr_pdf.text(invoice_lbl, 15, 45);
        qr_pdf.setFontStyle('normal');
        qr_pdf.text(number_lbl + cyg_invoice.company_info.resolution_prefix + '-' + cyg_invoice.number, 15, 50);

        let dateFormated = cyg_invoice.creation_date.getDate() + '/' + (cyg_invoice.creation_date.getMonth() + 1) + '/' + cyg_invoice.creation_date.getFullYear();
        qr_pdf.text(date_lbl + dateFormated, 15, 55);
        qr_pdf.text(payment_method_lbl + aux_payment_method, 15, 60);
        qr_pdf.setFontSize(12);
        qr_pdf.setFontStyle('bold');
        qr_pdf.text(customer_lbl, 15, 70);
        qr_pdf.setFontStyle('normal');
        qr_pdf.text(cyg_invoice.client_info.name, 15, 75);
        qr_pdf.text(cyg_invoice.client_info.address, 15, 80);
        qr_pdf.text(cyg_invoice.client_info.city + ', ' + aux_country, 15, 85);
        qr_pdf.text(identication_lbl + '' + cyg_invoice.client_info.identification, 15, 90);
        qr_pdf.text(phone_lbl + '' + cyg_invoice.client_info.phone, 15, 95);
        qr_pdf.text(email_lbl + '' + cyg_invoice.client_info.email, 15, 100);
        qr_pdf.setFontStyle('bold');
        qr_pdf.text(desc_lbl, 15, 115);
        //qr_pdf.text(period_lbl, 110, 115);
        qr_pdf.text(amount_lbl, 195, 115, 'right');
        qr_pdf.line(15, 117, 195, 117);
        qr_pdf.setFontStyle('normal');
        var splitTitle = qr_pdf.splitTextToSize(aux_description, 120);
        qr_pdf.text(15, 125, splitTitle);
        cyg_invoice.establishmentsInfo.forEach((establishmentInfo) => {
            y = this.calculateY(y, 2);
            qr_pdf.text(25, y, '- ' + establishmentInfo.establishment_name);
            y = this.calculateY(y, 6);
            qr_pdf.text(35, y, package_of_medal + ' ' + establishmentInfo.bag_plan_points + ' ' + medals);
            qr_pdf.text(185, y, establishmentInfo.bag_plan_price, 'right');
            qr_pdf.text(195, y, establishmentInfo.bag_plan_currency, 'right');
            y = this.calculateY(y, 6);
            if (parseInt(establishmentInfo.credit_points) > 0 && parseInt(establishmentInfo.credit_price) > 0) {
                qr_pdf.text(35, y, pending_medals + ' ' + establishmentInfo.credit_points + ' ' + medals);
                qr_pdf.text(185, y, establishmentInfo.credit_price, 'right');
                qr_pdf.text(195, y, establishmentInfo.bag_plan_currency, 'right');
                y = this.calculateY(y, 6);
            }
        });
        qr_pdf.line(15, y, 195, y);
        y = this.calculateY(y, 10);
        qr_pdf.setFontStyle('bold');
        qr_pdf.text(subtotal_lbl, 140, y);
        qr_pdf.setFontStyle('normal');
        qr_pdf.text(185, y, cyg_invoice.subtotal.toString(), 'right');
        qr_pdf.text(195, y, cyg_invoice.currency, 'right');
        y = this.calculateY(y, 6);
        qr_pdf.setFontStyle('bold');
        qr_pdf.text(iva_lbl, 140, y);
        qr_pdf.setFontStyle('normal');
        qr_pdf.text(185, y, cyg_invoice.iva.toString(), 'right');
        qr_pdf.text(195, y, cyg_invoice.currency, 'right');
        y = this.calculateY(y, 6);
        qr_pdf.setFontStyle('bold');
        qr_pdf.text(total_lbl, 140, y);
        qr_pdf.setFontStyle('normal');
        qr_pdf.text(185, y, cyg_invoice.total.toString(), 'right');
        qr_pdf.text(195, y, cyg_invoice.currency, 'right');

        qr_pdf.text(cyg_invoice.generated_computer_msg, 195, 290, 'right');
        qr_pdf.output('save', cyg_invoice.number + '_' + dateFormated + '.pdf');
    }

    /**
         * Calculate Invoice pdf height
         * @param { Invoice } _pInvoice 
         * @param { string } _pCountryId
         */
    calculateHeight(_pInvoice: CygInvoice): number {

        let quantRows: number = 0;
        let initialHeightPage: number = 280;

        if (_pInvoice.country_id === '1900') {

            _pInvoice.establishmentsInfo.forEach((establishmentInfo) => {
                if (establishmentInfo.establishment_name) {
                    quantRows += 6;
                }
                if (parseInt(establishmentInfo.bag_plan_points) > 0 &&
                    parseInt(establishmentInfo.bag_plan_price) > 0 &&
                    (establishmentInfo.bag_plan_currency != null || establishmentInfo.bag_plan_currency != undefined)) {
                    quantRows += 6;
                }
                if (parseInt(establishmentInfo.credit_points) > 0 && parseInt(establishmentInfo.credit_price) > 0) {
                    quantRows += 6;
                }
            });
            initialHeightPage = initialHeightPage + quantRows;
            return initialHeightPage
        }
    }

    /**
     * Allow add top to pdf page
     * @param { number } _pY 
     * @param { number } _pAdd 
     */
    calculateY(_pY: number, _pAdd: number): number {
        _pY = _pY + _pAdd;
        return _pY;
    }

    /**
    * This function open de error dialog according to parameters 
    * @param {string} title
    * @param {string} subtitle
    * @param {string} content
    * @param {string} btnCancelLbl
    * @param {string} btnAcceptLbl
    * @param {boolean} showBtnCancel
    */
    openDialog(title: string, subtitle: string, content: string, btnCancelLbl: string, btnAcceptLbl: string, showBtnCancel: boolean) {

        this._mdDialogRef = this._mdDialog.open(AlertConfirmComponent, {
            disableClose: true,
            data: {
                title: title,
                subtitle: subtitle,
                content: content,
                buttonCancel: btnCancelLbl,
                buttonAccept: btnAcceptLbl,
                showBtnCancel: showBtnCancel
            }
        });
        this._mdDialogRef.afterClosed().subscribe(result => {
            this._mdDialogRef = result;
            if (result.success) {

            }
        });
    }

    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * ngOnDestroy Implementation
     */
    ngOnDestroy() {
        this.removeSubscriptions();
    }
}