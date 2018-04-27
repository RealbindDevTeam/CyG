import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { NavController, NavParams, ModalController, LoadingController, ToastController, AlertController, Platform } from 'ionic-angular';
import { FormGroup, Validators, FormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from 'meteor-rxjs';
import { Subscription, Subject, Observable } from 'rxjs';
import { Items } from 'cyg_web/both/collections/menu/item.collection';
import { Item } from 'cyg_web/both/models/menu/item.model';
import { Currencies } from 'cyg_web/both/collections/general/currency.collection';
import { UserLanguageServiceProvider } from '../../../../../providers/user-language-service/user-language-service';
import { Network } from '@ionic-native/network';
import { LightboxPage } from "../../../../../pages/general/lightbox/lightbox";

/*
  Generated class for the ItemDetail page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'item-detail-establishment',
  templateUrl: 'item-detail-establishment.html'
})
export class ItemDetailEstablishmentPage implements OnInit, OnDestroy {

  private _userLang: string;
  private _items;
  private _itemSub: Subscription;
  private _currenciesSub: Subscription;
  private disconnectSubscription: Subscription;
  private ngUnsubscribe: Subject<void> = new Subject<void>();

  private _item_code: string = '';
  private _res_code: string = '';
  private _observations: string = '';
  private _item: any[] = [];
  private _showAddBtn: boolean = true;
  private _lastQuantity: number = 1;
  private _letChange: boolean = true;
  private _disabledAddBtn: boolean = false;
  private _loadingMsg: string;
  private _toastMsg: string;
  private _disabledMinusBtn: boolean = true;
  private _statusArray: string[];
  private _currentUserId: string;
  private _currencyCode: string;

  constructor(public _navCtrl: NavController,
    public _navParams: NavParams,
    public _modalCtrl: ModalController,
    public _translate: TranslateService,
    public _zone: NgZone,
    public _loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private _userLanguageService: UserLanguageServiceProvider,
    public _alertCtrl: AlertController,
    public _platform: Platform,
    private _network: Network) {
    _translate.setDefaultLang('en');
    this._currentUserId = Meteor.userId();
    this._statusArray = ['ORDER_STATUS.REGISTERED'];
  }

  ionViewDidLoad() { }

  ngOnInit() {
    this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
    this.removeSubscriptions();
    this._item_code = this._navParams.get("item_id");
    this._res_code = this._navParams.get("res_id");

    this._itemSub = MeteorObservable.subscribe('itemsByEstablishment', this._res_code).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._zone.run(() => {
        MeteorObservable.autorun().subscribe(() => {
          this._items = Items.find({ _id: this._item_code }).zone();
          this._item = Items.collection.find({ _id: this._item_code }).fetch();
          for (let item of this._item) {
            let aux = item.establishments.find(element => element.establishment_id === this._res_code);
            this._showAddBtn = aux.isAvailable;
          }
          this._disabledAddBtn = false;
          this._letChange = false;
        });
      });
    });

    this._currenciesSub = MeteorObservable.subscribe('getCurrenciesByEstablishmentsId', [this._res_code]).takeUntil(this.ngUnsubscribe).subscribe(() => {
      this._currencyCode = Currencies.collection.find({}).fetch()[0].code + ' ';
    });
  }

  /**
   * open image if the item
   * @param pItemImg {string}
   */
  openItemImage(pItemImg: string) {
    let contactModal = this._modalCtrl.create(LightboxPage, { item_img: pItemImg });
    contactModal.present();
  }

  ionViewDidEnter() {
    this.isConnected();
    this.disconnectSubscription = this._network.onDisconnect().subscribe(data => {
      let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
      let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
      let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
      this.presentAlert(title, subtitle, btn);
    }, error => console.error(error));
  }

  ionViewWillLeave() {
    this.disconnectSubscription.unsubscribe();
  }

  /** 
   * This function verify with network plugin if device has internet connection
  */
  isConnected() {
    if (this._platform.is('cordova')) {
      let conntype = this._network.type;
      let validateConn = conntype && conntype !== 'unknown' && conntype !== 'none';
      if (!validateConn) {
        let title = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.TITLE');
        let subtitle = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.SUBTITLE');
        let btn = this.itemNameTraduction('MOBILE.CONNECTION_ALERT.BTN');
        this.presentAlert(title, subtitle, btn);
      } else {
        if (!Meteor.status().connected) {
          let title2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.TITLE');
          let subtitle2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.SUBTITLE');
          let btn2 = this.itemNameTraduction('MOBILE.SERVER_ALERT.BTN');
          this.presentAlert(title2, subtitle2, btn2);
        }
      }
    }
  }

  /**
   * Present the alert for advice to internet
  */
  presentAlert(_pTitle: string, _pSubtitle: string, _pBtn: string) {
    let alert = this._alertCtrl.create({
      title: _pTitle,
      subTitle: _pSubtitle,
      enableBackdropDismiss: false,
      buttons: [
        {
          text: _pBtn,
          handler: () => {
            this.isConnected();
          }
        }
      ]
    });
    alert.present();
  }

  itemNameTraduction(itemName: string): string {
    var wordTraduced: string;
    this._translate.get(itemName).subscribe((res: string) => {
      wordTraduced = res;
    });
    return wordTraduced;
  }

  /**
   * Return Item price by current establishment
   * @param {Item} _pItem 
   */
  getItemPrice(_pItem: Item): number {
    return _pItem.establishments.filter(r => r.establishment_id === this._res_code)[0].price;
  }

  /**
   * Return item name by id
   * @param _pItemId 
   */
  getItemName(_pItemId: string): string {
    if (_pItemId) {
      return Items.findOne({ _id: _pItemId }).name;
    }
    return '';
  }

  ngOnDestroy() {
    this.removeSubscriptions();
  }

  /**
   * Remove all subscriptions
   */
  removeSubscriptions(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
