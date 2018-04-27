import { Component, Input } from '@angular/core';

@Component({
    selector: 'medal-cyg',
    templateUrl: 'medal-cyg.html'
})
export class MedalCYG {

    @Input()
    width: string;

    @Input()
    height: string;

    /**
     * MedalCYG Constructor
     */
    constructor(){

    }
}