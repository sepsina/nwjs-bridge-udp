import { Component, Inject, NgZone, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { StorageService } from '../services/storage.service';
import { UtilsService } from '../services/utils.service';
import { Validators, FormControl } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

import * as gConst from '../gConst';
import * as gIF from '../gIF'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

const EMPTY_NAME = '--- empty ---';

@Component({
    selector: 'app-stats',
    templateUrl: './x_stat.page.html',
    styleUrls: ['./x_stat.page.scss'],
})
export class EditStats implements AfterViewInit {

    @ViewChild('onOffBoxRef', {read: ElementRef, static:false}) onOffBoxRef: ElementRef;
    @ViewChild('usedWrapRef', {read: ElementRef, static:false}) wrapRef: ElementRef;

    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch(event.key){
            case 'Escape': {
                this.close();
                break;
            }
        }
    }

    thermostatDesc: gIF.descVal_t[] = [];

    selThermostat: gIF.thermostat_t;
    thermostats: gIF.thermostat_t[] = [];
    on_off_all: gIF.on_off_actuator_t[] = [];
    on_off_used: gIF.on_off_actuator_t[] = [];
    on_off_free: gIF.on_off_actuator_t[] = [];

    setPointFormCtrl = new FormControl(0, [Validators.required]);

    constructor(private dialogRef: MatDialogRef<EditStats>,
                @Inject(MAT_DIALOG_DATA) public dlgData: any,
                private storage: StorageService,
                private utils: UtilsService,
                private ngZone: NgZone) {
        // ---
    }

    /***********************************************************************************************
     * fn          ngAfterViewInit
     *
     * brief
     *
     */
     ngAfterViewInit(){
        setTimeout(() => {
            this.refresh();
        }, 0);
    }

    /***********************************************************************************************
     * fn          refresh
     *
     * brief
     *
     */
    refresh() {

        let attribs: gIF.hostedAttr_t[] = JSON.parse(JSON.stringify(Array.from(this.storage.attrMap.values())));

        this.thermostats = [];
        this.on_off_all = [];
        this.on_off_used = [];
        this.on_off_free = [];

        for(const attr of attribs){
            if(attr.clusterID === gConst.CLUSTER_ID_MS_TEMPERATURE_MEASUREMENT){
                let thermostat = {} as gIF.thermostat_t;
                thermostat.name = attr.name;
                thermostat.ip = attr.ip;
                thermostat.port = attr.port;
                thermostat.partNum = attr.partNum;
                thermostat.extAddr = attr.extAddr;
                thermostat.shortAddr = attr.shortAddr;
                thermostat.endPoint = attr.endPoint;
                thermostat.hysteresis = gConst.THERMOSTAT_HYSTERESIS;
                thermostat.actuators = [];
                const key = this.storage.thermostatKey(attr.extAddr, attr.endPoint);
                const nvThermostat: gIF.thermostat_t = this.storage.nvThermostatsMap.get(key);
                if(nvThermostat){
                    thermostat.setPoint = nvThermostat.setPoint;
                    thermostat.prevSetPoint = nvThermostat.prevSetPoint;
                    thermostat.workPoint = nvThermostat.workPoint;
                    thermostat.actuators = [...nvThermostat.actuators];
                }
                else {
                    thermostat.setPoint = 20.0;
                    thermostat.prevSetPoint = 0;
                    thermostat.workPoint = 20.0;
                    thermostat.actuators = [];
                }
                this.thermostats.push(thermostat);
            }
            if(attr.clusterServer){
                if(attr.clusterID === gConst.CLUSTER_ID_GEN_ON_OFF){
                    let on_off_actuator = {} as gIF.on_off_actuator_t;
                    on_off_actuator.valid = true;
                    on_off_actuator.name = attr.name;
                    on_off_actuator.ip = attr.ip;
                    on_off_actuator.port = attr.port;
                    on_off_actuator.partNum = attr.partNum;
                    on_off_actuator.extAddr = attr.extAddr;
                    on_off_actuator.shortAddr = attr.shortAddr;
                    on_off_actuator.endPoint = attr.endPoint;
                    this.on_off_all.push(on_off_actuator);
                }
            }
        }
        this.storage.delAllThermostat();
        for(const thermostat of this.thermostats){
            this.storage.storeThermostat(thermostat);
        }

        if(this.thermostats.length > 0){
            this.selThermostat = this.thermostats[0];
            this.setPointFormCtrl.setValue(this.selThermostat.setPoint);
            this.ngZone.run(()=>{
                this.setThermostat(this.selThermostat);
            });
            this.setThermostatDesc(this.selThermostat);
        }
        else {
            this.on_off_all = [];
            this.on_off_used = [];
            this.on_off_free = [];
            this.putEmpties(this.on_off_used,
                            this.on_off_free);
        }

        setTimeout(() => {
            const boxHeight = this.onOffBoxRef.nativeElement.offsetHeight;
            let boxNum = this.on_off_used.length;
            if(boxNum > 4){
                boxNum = 4;
            }
            const wrapHeight = boxNum * boxHeight;
            this.wrapRef.nativeElement.style.height = `${wrapHeight}px`;
        }, 200);
    }

    /***********************************************************************************************
     * fn          setThermostat
     *
     * brief
     *
     */
    setThermostat(thermostat: gIF.thermostat_t){

        let used_actuators: gIF.on_off_actuator_t[] = [];
        let free_actuators: gIF.on_off_actuator_t[] = [...this.on_off_all];

        for(const actuator of thermostat.actuators){
            let idx = free_actuators.length;
            while(idx--){
                if(free_actuators[idx].extAddr === actuator.extAddr){
                    if(free_actuators[idx].endPoint === actuator.endPoint){
                        const used = free_actuators.splice(idx, 1)[0];
                        used_actuators.push(used);
                    }
                }
            }
        }
        this.saveActuators(thermostat,
                           used_actuators);
        this.putEmpties(used_actuators,
                        free_actuators);
        this.ngZone.run(()=>{
            this.on_off_used = used_actuators;
            this.on_off_free = free_actuators;
        });
    }

    /***********************************************************************************************
     * fn          thermostatSelected
     *
     * brief
     *
     */
    public thermostatSelected(event: MatSelectChange){

        this.setPointFormCtrl.setValue(this.selThermostat.setPoint);
        this.setThermostatDesc(this.selThermostat);
        this.setThermostat(this.selThermostat);
    }

    /***********************************************************************************************
     * fn          setThermostatDesc
     *
     * brief
     *
     */
    public setThermostatDesc(thermostat: gIF.thermostat_t){

        this.thermostatDesc = [];
        let partDesc: gIF.part_t = this.dlgData.partMap.get(thermostat.partNum);
        if(partDesc){
            let descVal = {} as gIF.descVal_t;
            descVal.key = 'S/N:';
            descVal.value = this.utils.extToHex(thermostat.extAddr);
            this.thermostatDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'node-name:';
            descVal.value = partDesc.devName;
            this.thermostatDesc.push(descVal);
            descVal = {} as gIF.descVal_t;
            descVal.key = 'label:';
            descVal.value = partDesc.part;
            this.thermostatDesc.push(descVal);
        }
    }

    /***********************************************************************************************
     * fn          showTooltip
     *
     * brief
     *
     */
    showTooltip(tt: MatTooltip,
                on_off: gIF.on_off_actuator_t){
        let ttMsg = '';
        ttMsg += `S/N: ${this.utils.extToHex(on_off.extAddr)} \n`;
        let partDesc: gIF.part_t = this.dlgData.partMap.get(on_off.partNum);
        if(partDesc){
            ttMsg += `node-name: ${partDesc.devName} \n`;
            ttMsg += `part: ${partDesc.part} \n`;
            ttMsg += `url: ${partDesc.url} \n`;
        }
        tt.message = ttMsg;
        tt.showDelay = 500;
        tt.tooltipClass = "bind-tooltip";
        tt.show();
    }

    /***********************************************************************************************
     * fn          close
     *
     * brief
     *
     */
    close() {
        this.dialogRef.close();
    }

    /***********************************************************************************************
     * fn          usedDrop
     *
     * brief
     *
     */
    usedDrop(event: CdkDragDrop<any[]>) {

        if(event.previousContainer !== event.container){
            const on_off = this.on_off_free.splice(event.previousIndex, 1)[0];
            this.on_off_used.splice(event.currentIndex, 0, on_off); // insert

            let used_actuators: gIF.on_off_actuator_t[] = [];
            for(let i = 0; i < this.on_off_used.length; i++){
                if(this.on_off_used[i].name != EMPTY_NAME){
                    used_actuators.push(this.on_off_used[i])
                }
            }
            this.saveActuators(this.selThermostat,
                               used_actuators);
            let free_actuators: gIF.on_off_actuator_t[] = [];
            for(let i = 0; i < this.on_off_free.length; i++){
                if(this.on_off_free[i].name != EMPTY_NAME){
                    free_actuators.push(this.on_off_free[i])
                }
            }
            this.putEmpties(used_actuators,
                            free_actuators);
            this.ngZone.run(()=>{
                this.on_off_used = used_actuators;
                this.on_off_free = free_actuators;
            });
        }
        else {
            moveItemInArray(event.container.data,
                            event.previousIndex,
                            event.currentIndex);
        }
    }

    /***********************************************************************************************
     * fn          freeDrop
     *
     * brief
     *
     */
    freeDrop(event: CdkDragDrop<any[]>) {

        if(event.previousContainer !== event.container){
            const on_off = this.on_off_used.splice(event.previousIndex, 1)[0];
            this.on_off_free.splice(event.currentIndex, 0, on_off); // insert

            let used_actuators: gIF.on_off_actuator_t[] = [];
            for(let i = 0; i < this.on_off_used.length; i++){
                if(this.on_off_used[i].name != EMPTY_NAME){
                    used_actuators.push(this.on_off_used[i])
                }
            }
            this.saveActuators(this.selThermostat,
                               used_actuators);
            let free_actuators: gIF.on_off_actuator_t[] = [];
            for(let i = 0; i < this.on_off_free.length; i++){
                if(this.on_off_free[i].name != EMPTY_NAME){
                    free_actuators.push(this.on_off_free[i])
                }
            }
            this.putEmpties(used_actuators,
                            free_actuators);
            this.ngZone.run(()=>{
                this.on_off_used = used_actuators;
                this.on_off_free = free_actuators;
            });
        }
        else {
            moveItemInArray(event.container.data,
                            event.previousIndex,
                            event.currentIndex);
        }
    }

    /***********************************************************************************************
     * fn          putEmpties
     *
     * brief
     *
     */
    putEmpties(used: gIF.on_off_actuator_t[], free: gIF.on_off_actuator_t[]){

        if(used.length < gConst.USED_LIST_LEN){
            for(let i = used.length; i < gConst.USED_LIST_LEN; i++){
                let on_off = {} as gIF.on_off_actuator_t;
                on_off.valid = false;
                on_off.name = EMPTY_NAME;
                used.push(on_off);
            }
        }
        if(free.length < gConst.FREE_LIST_LEN){
            for(let i = free.length; i < gConst.FREE_LIST_LEN; i++){
                let on_off = {} as gIF.on_off_actuator_t;
                on_off.valid = false;
                on_off.name = EMPTY_NAME;
                free.push(on_off);
            }
        }
    }

    /***********************************************************************************************
     * @fn          setPointErr
     *
     * @brief
     *
     */
    setPointErr() {
        if(this.setPointFormCtrl.hasError('required')){
            return 'You must enter a value';
        }
    }

    /***********************************************************************************************
     * @fn          spChange
     *
     * @brief
     *
     */
    spChange(event) {
        console.log(event.target.value);
        this.selThermostat.setPoint = parseFloat(event.target.value);
        this.storage.storeThermostat(this.selThermostat);
    }

    /***********************************************************************************************
     * @fn          saveActuators
     *
     * @brief
     *
     */
    saveActuators(thermostat: gIF.thermostat_t, actuators: gIF.on_off_actuator_t[]) {

        thermostat.actuators = [];
        for(const on_off of actuators){
            const actuator = {} as gIF.thermostatActuator_t;
            actuator.name = on_off.name;
            actuator.extAddr = on_off.extAddr;
            actuator.endPoint = on_off.endPoint;
            thermostat.actuators.push(actuator);
        }
        this.storage.storeThermostat(thermostat);
    }
}
