import { Component, OnInit, Inject, ViewChild, ElementRef, AfterViewInit, OnDestroy, Renderer2 } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { StorageService } from '../services/storage.service';
import { Validators, FormGroup, FormControl } from '@angular/forms';
import { EventsService } from '../services/events.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as gConst from '../gConst';
import * as gIF from '../gIF'
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-set-corr',
    templateUrl: './set-corr.html',
    styleUrls: ['./set-corr.scss'],
})
export class SetCorr implements OnInit, AfterViewInit, OnDestroy {

    valCorr = {} as gIF.valCorr_t;
    selAttr: gIF.hostedAttr_t;

    hasUnits = false;
    unitSel = [];
    unitsCtrl = new FormControl('', Validators.required);

    offsetFormCtrl: FormControl;

    constructor(public dialogRef: MatDialogRef<SetCorr>,
                @Inject(MAT_DIALOG_DATA) public keyVal: any,
                public events: EventsService,
                public serialLink: SerialLinkService,
                public storage: StorageService,
                private renderer: Renderer2) {
        this.selAttr = this.keyVal.value;
    }

    ngOnDestroy(): void {
        // ---
    }

    ngAfterViewInit(): void {
        // ---
    }

    ngOnInit() {

        this.valCorr = this.selAttr.valCorr;

        this.offsetFormCtrl = new FormControl(
            this.valCorr.offset, [Validators.required]
        );

        switch(this.selAttr.clusterID){
            case gConst.CLUSTER_ID_MS_TEMPERATURE_MEASUREMENT: {
                this.hasUnits = true;
                this.unitSel.push({name: 'degC', unit: gConst.DEG_C});
                this.unitSel.push({name: 'degF', unit: gConst.DEG_F});
                this.unitsCtrl.setValue(this.unitSel[0]);
                if(this.selAttr.valCorr.units == gConst.DEG_F){
                    this.unitsCtrl.setValue(this.unitSel[1]);
                }
                break;
            }
            case gConst.CLUSTER_ID_MS_PRESSURE_MEASUREMENT: {
                this.hasUnits = true;
                this.unitSel.push({name: 'mBar', unit: gConst.M_BAR});
                this.unitSel.push({name: 'inHg', unit: gConst.IN_HG});
                this.unitsCtrl.setValue(this.unitSel[0]);
                if(this.selAttr.valCorr.units == gConst.IN_HG){
                    this.unitsCtrl.setValue(this.unitSel[1]);
                }
                break;
            }
        }
    }

    async save() {
        this.valCorr.units = (this.unitsCtrl.value as any).unit;
        this.valCorr.offset = this.offsetFormCtrl.value;

        await this.storage.setAttrCorr(this.valCorr,
                                        this.keyVal);
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }

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
        //console.log(event);
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
