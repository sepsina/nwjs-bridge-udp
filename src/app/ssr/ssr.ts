import { Component, Inject, OnInit, AfterViewInit, NgZone } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { EventsService } from '../services/events.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UtilsService } from '../services/utils.service';

import * as gConst from '../gConst';
import * as gIF from '../gIF'

const OFF = 0;
const ON = 1;
const TOGGLE = 2;

@Component({
    selector: 'app-ssr',
    templateUrl: './ssr.html',
    styleUrls: ['./ssr.scss']
})
export class SSR implements OnInit, AfterViewInit {

    recs: string[] = [];

    constructor(private dialogRef: MatDialogRef<SSR>,
                @Inject(MAT_DIALOG_DATA) public dlgData: any,
                private serialLink: SerialLinkService,
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
        // ---
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

    /***********************************************************************************************
     * @fn          setActuatorOn
     *
     * @brief
     *
     */
    setActuatorOn(){
        this.setActuator(ON);
    }

    /***********************************************************************************************
     * @fn          setActuatorOff
     *
     * @brief
     *
     */
    setActuatorOff(){
        this.setActuator(OFF);
    }

    /***********************************************************************************************
     * @fn          toggleActuator
     *
     * @brief
     *
     */
    toggleActuator(){
        this.setActuator(TOGGLE);
    }

    /***********************************************************************************************
     * @fn          setActuator
     *
     * @brief
     *
     */
    setActuator(state: number){
        const zclCmd = {} as gIF.udpZclReq_t;
        zclCmd.ip = this.dlgData.attr.ip;
        zclCmd.port = this.dlgData.attr.port;
        zclCmd.extAddr = this.dlgData.attr.extAddr;
        zclCmd.endPoint = this.dlgData.attr.endPoint;
        zclCmd.clusterID = gConst.CLUSTER_ID_GEN_ON_OFF;
        zclCmd.hasRsp = 0;
        zclCmd.cmdLen = 3;
        zclCmd.cmd = [];
        zclCmd.cmd[0] = 0x11; // cluster spec cmd, not manu spec, client to srv dir, disable dflt rsp
        zclCmd.cmd[1] = 0x00; // seq num -> not used
        zclCmd.cmd[2] = state;  // ON/OFF command
        this.serialLink.udpZclCmd(JSON.stringify(zclCmd));
    }


}
