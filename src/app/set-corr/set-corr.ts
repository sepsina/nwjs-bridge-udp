import { Component, OnInit, Inject, NgZone, ViewChild, ElementRef, AfterViewInit, OnDestroy, HostListener, AfterContentInit } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { StorageService } from '../services/storage.service';
import { Validators, FormControl } from '@angular/forms';
import { EventsService } from '../services/events.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as gConst from '../gConst';
import * as gIF from '../gIF'

@Component({
    selector: 'app-set-corr',
    templateUrl: './set-corr.html',
    styleUrls: ['./set-corr.scss'],
})
export class SetCorr implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('offset') offset: ElementRef;

    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch(event.key){
            case 'Escape': {
                this.close();
                break;
            }
        }
    }

    valCorr = {} as gIF.valCorr_t;
    selAttr: gIF.hostedAttr_t;

    hasUnits = false;
    unitSel = [];

    unitsCtrl: FormControl;
    offsetFormCtrl: FormControl;

    offsetVal = 0;
    selUnit = 0;

    constructor(public dialogRef: MatDialogRef<SetCorr>,
                @Inject(MAT_DIALOG_DATA) public keyVal: any,
                public events: EventsService,
                public serialLink: SerialLinkService,
                public storage: StorageService,
                public ngZone: NgZone) {
        this.selAttr = this.keyVal.value;
    }

    ngOnDestroy(): void {
        // ---
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.offset.nativeElement.focus();
            this.offset.nativeElement.select();
        }, 100);
    }

    ngOnInit() {

        this.valCorr = this.selAttr.valCorr;
        this.offsetVal = this.valCorr.offset;

        this.unitsCtrl = new FormControl(
            '', [Validators.required]
        );
        this.offsetFormCtrl = new FormControl(
            this.offsetVal, [Validators.required]
        );

        switch(this.selAttr.clusterID){
            case gConst.CLUSTER_ID_MS_TEMPERATURE_MEASUREMENT: {
                this.hasUnits = true;
                this.unitSel.push({name: 'degC', unit: gConst.DEG_C});
                this.unitSel.push({name: 'degF', unit: gConst.DEG_F});
                let offset = this.offsetVal;
                if(this.selAttr.valCorr.units == gConst.DEG_F){
                    this.selUnit = gConst.DEG_F;
                    this.unitsCtrl.setValue(this.unitSel[1]);
                    offset = offset * 9.0 / 5.0;
                }
                if(this.selAttr.valCorr.units == gConst.DEG_C){
                    this.selUnit = gConst.DEG_C;
                    this.unitsCtrl.setValue(this.unitSel[0]);
                }
                offset = Math.round(offset * 100) / 100;
                this.offsetFormCtrl.setValue(offset);
                break;
            }
        }
    }

    /***********************************************************************************************
     * @fn          save
     *
     * @brief
     *
     */
    async save() {

        this.valCorr.units = this.selUnit;
        this.valCorr.offset = this.offsetVal;

        this.storage.setAttrCorr(this.valCorr,
                                 this.keyVal);
        this.dialogRef.close();
    }

    /***********************************************************************************************
     * @fn          close
     *
     * @brief
     *
     */
    close() {
        this.dialogRef.close();
    }

    /***********************************************************************************************
     * @fn          offsetErr
     *
     * @brief
     *
     */
    offsetErr() {
        if(this.offsetFormCtrl.hasError('required')){
            return 'You must enter a value';
        }
    }

    /***********************************************************************************************
     * @fn          unitsChanged
     *
     * @brief
     *
     */
    unitsChanged(event){

        this.selUnit = event.value.unit;
        let offset = this.offsetVal;

        if(this.selUnit == gConst.DEG_F){
            offset = offset * 9.0 / 5.0;
        }

        offset = Math.round(offset * 100) / 100;
        this.offsetFormCtrl.setValue(offset);
    }

    /***********************************************************************************************
     * @fn          offsetChanged
     *
     * @brief
     *
     */
    offsetChanged(event: any){

        this.offsetVal = event.target.valueAsNumber;

        if(this.selUnit == gConst.DEG_F){
            this.offsetVal = this.offsetVal * 5 / 9; // ofset to degC
        }
    }

    /***********************************************************************************************
     * @fn          isValid
     *
     * @brief
     *
     */
    isValid(){
        if(this.offsetFormCtrl.invalid){
            return false;
        }
        return true;
    }

}
