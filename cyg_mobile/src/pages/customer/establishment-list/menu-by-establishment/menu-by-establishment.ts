import { Component, OnInit, OnDestroy, NgZone, ViewChild } from '@angular/core';
import { NavController, NavParams, Select } from 'ionic-angular';
import { TranslateService } from '@ngx-translate/core';
import { MeteorObservable } from "meteor-rxjs";
import { Subscription, Subject } from "rxjs";
import { UserLanguageServiceProvider } from '../../../../providers/user-language-service/user-language-service';
import { Establishments } from 'cyg_web/both/collections/establishment/establishment.collection';
import { UserDetails } from 'cyg_web/both/collections/auth/user-detail.collection';
import { Sections } from 'cyg_web/both/collections/menu/section.collection';
import { Categories } from 'cyg_web/both/collections/menu/category.collection';
import { Subcategories } from 'cyg_web/both/collections/menu/subcategory.collection';
import { Items } from 'cyg_web/both/collections/menu/item.collection';
import { Additions } from 'cyg_web/both/collections/menu/addition.collection';
import { ItemCardEstablishmentComponent } from './item-card-establishment';
import { ItemDetailEstablishmentPage } from './item-detail-establishment/item-detail-establishment';
import { AdditionsEstablishmentPage } from '../additions-establishment/additions-establishment';

@Component({
    selector: 'menu-by-establishment-page',
    templateUrl: 'menu-by-establishment.html'
})

export class MenuByEstablishmentPage implements OnInit, OnDestroy {

    @ViewChild('select1') select1: Select;

    private _userEstablishmentSubscription: Subscription;
    private _userDetailSubscription: Subscription;
    private _sectionsSubscription: Subscription;
    private _categoriesSubscription: Subscription;
    private _subcategoriesSubscription: Subscription;
    private _itemsSubscription: Subscription;
    private _additionsSubscription: Subscription;
    private ngUnsubscribe: Subject<void> = new Subject<void>();

    //private _userDetail: any;
    private _establishment: any;
    private _sections: any;
    private _items: any;
    private _itemsRecommended;
    private _categories: any;
    private _subcategories: any;
    private _itemImagesThumbs: any;
    private _additions: any;

    private selected: string;
    private _additionsShow: boolean = false;
    private _establishmentId: string = "";
    private _showMenu: boolean = true;

    constructor(public _translate: TranslateService,
        public _navCtrl: NavController,
        public _navParams: NavParams,
        private _userLanguageService: UserLanguageServiceProvider,
        private _ngZone: NgZone) {
        _translate.setDefaultLang('en');
        this.selected = 'all';
        this._establishmentId = this._navParams.get('establishment_id');
    }

    ngOnInit() {
        this._translate.use(this._userLanguageService.getLanguage(Meteor.user()));
        this.removeSubscriptions();
        let _sections: string[] = [];
        let _categories: string[] = [];
        this._userEstablishmentSubscription = MeteorObservable.subscribe('getEstablishmentById', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._establishment = Establishments.findOne({ _id: this._establishmentId });
            });
        });
        this._sectionsSubscription = MeteorObservable.subscribe('sectionsByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._sections = Sections.find({ establishments: { $in: [this._establishmentId] }, is_active: true }).zone();
                Sections.collection.find({ establishments: { $in: [this._establishmentId] }, is_active: true }).fetch().forEach(function <String>(s, index, arr) {
                    _sections.push(s._id);
                });
                this._categoriesSubscription = MeteorObservable.subscribe('categoriesByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
                    this._ngZone.run(() => {
                        this._categories = Categories.find({ section: { $in: _sections }, is_active: true }).zone();
                        Categories.collection.find({ section: { $in: _sections }, is_active: true }).fetch().forEach(function <String>(c, index, arr) {
                            _categories.push(c._id);
                        });
                        this._subcategoriesSubscription = MeteorObservable.subscribe('subcategoriesByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
                            this._ngZone.run(() => {
                                this._subcategories = Subcategories.find({ category: { $in: _categories }, is_active: true }).zone();
                            });
                        });
                    });
                });
            });
        });
        this._itemsSubscription = MeteorObservable.subscribe('itemsByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._items = Items.find({ 'establishments.establishment_id': { $in: [this._establishmentId] }, is_active: true }).zone();
                this._items.subscribe(() => { this.countItems(); });
                this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._establishmentId, 'establishments.recommended': true }).zone();
            });
        });
        this._additionsSubscription = MeteorObservable.subscribe('additionsByEstablishment', this._establishmentId).takeUntil(this.ngUnsubscribe).subscribe(() => {
            this._ngZone.run(() => {
                this._additions = Additions.find({ 'establishments.establishment_id': { $in: [this._establishmentId] }, is_active: true }).zone();
                this._additions.subscribe(() => {
                    let _lAdditions: number = Additions.collection.find({ 'establishments.establishment_id': { $in: [this._establishmentId] }, is_active: true }).count();
                    _lAdditions > 0 ? this._additionsShow = true : this._additionsShow = false;
                });
            });
        });
    }

    countItems(): void {
        Items.collection.find({ 'establishments.establishment_id': { $in: [this._establishmentId] }, is_active: true }).count() > 0 ? this._showMenu = true : this._showMenu = false;
    }

    validateSection(section_selected) {
        if (section_selected === 'all') {
            this._items = Items.find({});
            this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._establishmentId, 'establishments.recommended': true }).zone();
            this._sections = Sections.find({});
            this._categories = Categories.find({});
            this._subcategories = Subcategories.find({});
        } else if (section_selected === 'addition') {
            this.goToAddAdditions();
        } else if (section_selected === 'recommended') {
            this._items = null;
            this._sections = null;
            this._categories = null;
            this._subcategories = null;
            this._itemsRecommended = Items.find({ 'establishments.establishment_id': this._establishmentId, 'establishments.recommended': true }).zone();
        }
        else {
            this._itemsRecommended = null;
            this._sections = Sections.find({ _id: section_selected });
            this._items = Items.find({ sectionId: section_selected });
            this._categories = Categories.find({ section: section_selected });
            this._subcategories = Subcategories.find({});
        }
    }

    goTop() {
        this.select1.open();
        setTimeout(() => {
        }, 150);
    }

    goToDetail(_itemId) {
        this._navCtrl.push(ItemDetailEstablishmentPage, { item_id: _itemId, res_id: this._establishmentId });
    }

    goToAddAdditions() {
        this._navCtrl.push(AdditionsEstablishmentPage, { res_id: this._establishmentId });
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