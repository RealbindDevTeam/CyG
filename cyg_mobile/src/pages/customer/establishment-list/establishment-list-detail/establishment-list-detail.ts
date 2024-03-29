import { Component, OnInit, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { GoogleMaps, GoogleMap, GoogleMapsEvent, GoogleMapOptions, CameraPosition, MarkerOptions, Marker } from '@ionic-native/google-maps';
import { TranslateService } from '@ngx-translate/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController, Platform } from 'ionic-angular';
import { MeteorObservable } from 'meteor-rxjs';
import { Observable, Subscription, Subject } from 'rxjs';
import { Country } from 'cyg_web/both/models/general/country.model';
import { Countries } from 'cyg_web/both/collections/general/country.collection';
import { PaymentMethod } from 'cyg_web/both/models/general/paymentMethod.model';
import { PaymentMethods } from 'cyg_web/both/collections/general/paymentMethod.collection';
import { Establishment, EstablishmentProfile, EstablishmentProfileImage } from 'cyg_web/both/models/establishment/establishment.model';
import { Establishments, EstablishmentsProfile } from 'cyg_web/both/collections/establishment/establishment.collection';
import { ModalSchedule } from './modal-schedule/modal-schedule';
import { MenuByEstablishmentPage } from "../menu-by-establishment/menu-by-establishment";
import { TypeOfFood } from 'cyg_web/both/models/general/type-of-food.model';
import { TypesOfFood } from 'cyg_web/both/collections/general/type-of-food.collection';
import { RewardsInfoPage } from '../rewards-info/rewards-info';

@Component({
    selector: 'page-establishment-list-detail',
    templateUrl: 'establishment-list-detail.html'
})
export class EstablishmentListDetailPage implements OnInit, OnDestroy, AfterViewInit {

    private _map: GoogleMap;
    private _establishmentSubscription: Subscription;
    private _countriesSubscription: Subscription;
    private _establishmentProfileSubscription: Subscription;
    private _paymentMethodsSubscription: Subscription;
    private _typesOfFoodSub: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    private _establishmentsProfiles: Observable<EstablishmentProfile[]>;
    private _typesOfFood: Observable<TypeOfFood[]>;
    private _paymentMethods: Observable<PaymentMethod[]>;
    private _establishments: Observable<Establishment[]> = null;
    private _establishmentParam: Establishment = null;
    private _establishmentProfile: EstablishmentProfile = null;

    private _establishmentCountry: string = '';
    private _showDescription: boolean = false;
    private _profileImgs: EstablishmentProfileImage[] = [];
    private _showMap: boolean = false;

    /**
     * Constructor implementation
     * @param _navParams 
     * @param _translate 
     * @param googleMaps 
     * @param _ngZone 
     */
    constructor(public _navParams: NavParams,
        public _navCtrl: NavController,
        public _translate: TranslateService,
        public _modalCtrl: ModalController,
        private googleMaps: GoogleMaps,
        private _ngZone: NgZone,
        private _platform: Platform) {
        this._establishmentParam = this._navParams.get("establishment");
    }

    /**
     * ngOnInit implementation
     */
    ngOnInit() {
        this.removeSuscriptions();
        this._establishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentParam._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishments = Establishments.find({ _id: this._establishmentParam._id }).zone();
                this._establishments.subscribe(() => {
                    let establishment = Establishments.findOne({ _id: this._establishmentParam._id });
                    this._paymentMethodsSubscription = MeteorObservable.subscribe('getPaymentMethodsByEstablishmentId', establishment._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
                        this._paymentMethods = PaymentMethods.find({ _id: { $in: establishment.paymentMethods }, isActive: true }).zone();
                    });
                });
            });
        });

        this._countriesSubscription = MeteorObservable.subscribe('getCountryByEstablishmentId', this._establishmentParam._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                let _lCountry: Country = Countries.findOne({ _id: this._establishmentParam.countryId });
                if (_lCountry) {
                    this._establishmentCountry = this.itemNameTraduction(_lCountry.name);
                }
            });
        });

        this._establishmentProfileSubscription = MeteorObservable.subscribe('getEstablishmentProfile', this._establishmentParam._id).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishmentsProfiles = EstablishmentsProfile.find({ establishment_id: this._establishmentParam._id }).zone();
                this._establishmentsProfiles.subscribe(() => {
                    this._establishmentProfile = EstablishmentsProfile.findOne({ establishment_id: this._establishmentParam._id });
                    if (this._establishmentProfile) {
                        if (this._establishmentProfile.location.lat !== 4.5981 && this._establishmentProfile.location.lng !== -74.0758) {
                            this._showMap = true;
                            this.loadMap();
                        }
                    }
                });
            });
        });
        this._typesOfFoodSub = MeteorObservable.subscribe('typesOfFood').takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._typesOfFood = TypesOfFood.find({}).zone();
            });
        });
    }

    /**
     * ngAfterViewInit implementation
     */
    ngAfterViewInit() {
        this._platform.ready().then(() => {
            if (this._establishmentProfile) {
                if (this._establishmentProfile.location.lat !== 4.5981 && this._establishmentProfile.location.lng !== -74.0758) {
                    this._showMap = true;
                    this.loadMap();
                }
            }
        });
    }

    /**
     * Open rewards info
     * @param {string} _establishmentId 
     */
    openRewardsInfo(_establishmentId: string): void {
        this._navCtrl.push(RewardsInfoPage, { establishment: _establishmentId });
    }

    /**
     * Function to translate information
     * @param {string} _itemName
     */
    itemNameTraduction(itemName: string): string {
        var wordTraduced: string;
        this._translate.get(itemName).subscribe((res: string) => {
            wordTraduced = res;
        });
        return wordTraduced;
    }

    /**
     * Load map whit establishment location
     */
    loadMap() {
        if (this._establishmentProfile && this._establishmentProfile.location && this._establishmentProfile.location.lat && this._establishmentProfile.location.lng) {

            let mapOptions: GoogleMapOptions = {
                gestures: {
                    rotate: false,
                    tilt: false,
                    scroll: false,
                    zoom: false
                },
                camera: {
                    target: {
                        lat: this._establishmentProfile.location.lat,
                        lng: this._establishmentProfile.location.lng
                    },
                    zoom: 18,
                    tilt: 30
                }
            };
            this._map = GoogleMaps.create('map_canvas', mapOptions);
            this._map.setAllGesturesEnabled(true);
            this._map.one(GoogleMapsEvent.MAP_READY).then(() => {
                this._map.addMarker({
                    title: this._establishmentParam.name,
                    icon: 'red',
                    animation: 'DROP',
                    position: {
                        lat: this._establishmentProfile.location.lat,
                        lng: this._establishmentProfile.location.lng
                    }
                })
            });
        }
    }

    /**
     * 
     */
    showInformation() {
        this._showDescription = !this._showDescription;
    }

    /**
     * Open schedule modal
     */
    openSchedule() {
        let contactModal = this._modalCtrl.create(ModalSchedule, {
            establishment: this._establishmentParam
        });
        contactModal.present();
    }

    /**
     * Go to Menu by establishment id
     * @param _pEstablishmentId 
     */
    goToMenuByEstablishment(_pEstablishmentId: string) {
        this._navCtrl.push(MenuByEstablishmentPage, { establishment_id: _pEstablishmentId });
    }

    /**
     * Remove all suscriptions
     */
    removeSuscriptions(): void {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }

    /**
     * ngOndestroy implementation
     */
    ngOnDestroy() {
        this.ngUnsubscribe.next();
        this.ngUnsubscribe.complete();
    }
}