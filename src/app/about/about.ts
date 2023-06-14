import { Component, Inject, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { EventsService } from '../services/events.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UtilsService } from '../services/utils.service';

import * as gConst from '../gConst';
import * as gIF from '../gIF'

@Component({
    selector: 'app-about',
    templateUrl: './about.html',
    styleUrls: ['./about.css']
})
export class About implements OnInit, AfterViewInit {

    recs: string[] = [];

    constructor(private dialogRef: MatDialogRef<About>,
                @Inject(MAT_DIALOG_DATA) public dlgData: any,
                private events: EventsService,
                public utils: UtilsService,
                private ngZone: NgZone) {
    }

    /***********************************************************************************************
     * @fn          ngOnInit
     *
     * @brief
     *
     */
    ngOnInit(): void {
        //this.recs.push(`attr-name: ${this.dlgData.attr.name}`);
        this.recs.push(`S/N: ${this.utils.extToHex(this.dlgData.attr.extAddr)}`);
        let partDesc: gIF.part_t = this.dlgData.partMap.get(this.dlgData.attr.partNum);
        if(partDesc) {
            this.recs.push(`node: ${partDesc.devName}`);
            this.recs.push(`part: ${partDesc.part}`);
            this.recs.push(`url: ${partDesc.url}`);
        }
    }
    /***********************************************************************************************
     * @fn          ngAfterViewInit
     *
     * @brief
     *
     */
    ngAfterViewInit(): void {

    }
    /***********************************************************************************************
     * @fn          save
     *
     * @brief
     *
     */
    save() {
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



}
