import { Injectable, NgZone } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { MeteorObservable } from 'meteor-rxjs';
import { Element } from '../../../../../../both/models/points/establishment-point.model';

@Injectable()
export class PackageMedalService {

    bagPlanArray: Element[];

    constructor(private _ngZone: NgZone) {

    }
}