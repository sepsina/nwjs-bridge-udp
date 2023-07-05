import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, NgZone, OnDestroy, Renderer2 } from '@angular/core';
import { EventsService } from './services/events.service';
import { SerialLinkService } from './services/serial-link.service';
import { UdpService } from './services/udp.service';
import { StorageService } from './services/storage.service';
import { UtilsService } from './services/utils.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';

import { SetStyles } from './set-styles/set-styles.page';
import { EditScrolls } from './edit-scrolls/edit-scrolls';
import { EditBinds } from './binds/binds.page';
import { EditStats } from './x-stat/x_stat.page';

import * as gConst from './gConst';
import * as gIF from './gIF';

import { CdkDrag, CdkDragEnd, CdkDragStart } from '@angular/cdk/drag-drop';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

import { ShowLogs } from './logs/show-logs';
import { About } from './about/about';
import { SSR } from './ssr/ssr';
import { SetName } from './set-name/set-name';
import { Graph } from './graph/graph';
import { MoveElement } from './move-element/move-element';
import { SetCorr } from './set-corr/set-corr';
import { CdkContextMenuTrigger } from '@angular/cdk/menu';

const dumyScroll: gIF.scroll_t = {
    name: gConst.DUMMY_SCROLL,
    yPos: 0
}

const wait_msg = '--------';


@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('containerRef') containerRef: ElementRef;
    @ViewChild('floorPlanRef') floorPlanRef: ElementRef;

    @ViewChild(CdkContextMenuTrigger) ctxMenu: CdkContextMenuTrigger;

    bkgImgWidth: number;
    bkgImgHeight: number;
    imgUrl: string;
    imgDim = {} as gIF.imgDim_t;
    planPath = '';

    scrolls: gIF.scroll_t[] = [
        dumyScroll
    ];
    selScroll = this.scrolls[0];

    partDesc: gIF.partDesc_t[] = [];
    partMap = new Map();

    progressFlag = false;
    waitMsg = 'wait';
    msgIdx = 0;

    selAttr = {} as gIF.keyVal_t;
    ctrlFlag = false;
    graphFlag = false;
    corrFlag = false;
    moveFlag = false;

    footerTmo: any;
    footerStatus = '';

    dragRef: CdkDrag;

    constructor(private events: EventsService,
                private serialLink: SerialLinkService,
                private udp: UdpService,
                public storage: StorageService,
                private matDialog: MatDialog,
                private ngZone: NgZone,
                public utils: UtilsService,
                private httpClient: HttpClient,
                private renderer: Renderer2) {
        // ---
    }

    /***********************************************************************************************
     * fn          ngAfterViewInit
     *
     * brief
     *
     */
    ngAfterViewInit() {
        setTimeout(() => {
            this.init();
        }, 10);
    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit() {
        window.onbeforeunload = async ()=>{
            this.udp.closeSocket();
            this.serialLink.closeSocket();
        };

        this.events.subscribe('temp_event', (event: gIF.tempEvent_t)=>{
            this.tempEvent(event);
        });
    }

    /***********************************************************************************************
     * fn          ngOnDestroy
     *
     * brief
     *
     */
    ngOnDestroy() {
        // ---
    }

    /***********************************************************************************************
     * fn          init
     *
     * brief
     *
     */
    init() {

        const partsURL = '/assets/parts.json';

        this.httpClient.get(partsURL).subscribe({
            next: (parts: gIF.partDesc_t[])=>{
                this.partDesc = [];
                this.partMap.clear();
                for(let desc of parts){
                    this.partDesc.push(desc);
                    let part = {} as gIF.part_t;
                    part.devName = desc.devName;
                    part.part = desc.part;
                    part.url = desc.url;
                    this.partMap.set(desc.partNum, part);
                }
                //console.log(JSON.stringify(this.partDesc));
            },
            error: (err: HttpErrorResponse)=>{
                console.log(err.message);
            }
        });

        const bkgImgPath = '/assets/floor_plan.jpg';
        let bkgImg = new Image();
        bkgImg.onload = ()=>{
            this.bkgImgWidth = bkgImg.width;
            this.bkgImgHeight = bkgImg.height;
            const el = this.floorPlanRef.nativeElement;
            let divDim = el.getBoundingClientRect();
            this.imgDim.width = divDim.width;
            this.imgDim.height = Math.round((divDim.width / bkgImg.width) * bkgImg.height);
            this.renderer.setStyle(el, 'height', `${this.imgDim.height}px`);
            this.renderer.setStyle(el, 'backgroundImage', `url(${bkgImgPath})`);
            this.renderer.setStyle(el, 'backgroundAttachment', 'scroll');
            this.renderer.setStyle(el, 'backgroundRepeat', 'no-repeat');
            this.renderer.setStyle(el, 'backgroundSize', 'contain');
        };
        bkgImg.src = bkgImgPath;

        const nvScrolls = JSON.parse(this.storage.getScrolls());
        if(nvScrolls){
            this.scrolls = [];
            for(let i = 0; i < nvScrolls.length; i++){
                this.scrolls.push(nvScrolls[i]);
            }
            this.selScroll = this.scrolls[0];
        }
    }

    /***********************************************************************************************
     * fn          getAttrStyle
     *
     * brief
     *
     */
    getAttrStyle(keyVal: gIF.keyVal_t) {

        const attr = keyVal.value;

        let retStyle = {
            color: attr.style.color,
            'background-color': attr.style.bgColor,
            'font-size.px': attr.style.fontSize,
            'border-color': attr.style.borderColor,
            'border-width.px': attr.style.borderWidth,
            'border-style': attr.style.borderStyle,
            'border-radius.px': attr.style.borderRadius,
            'padding-top.px': attr.style.paddingTop,
            'padding-right.px': attr.style.paddingRight,
            'padding-bottom.px': attr.style.paddingBottom,
            'padding-left.px': attr.style.paddingLeft,
        };
        if(attr.isValid == false) {
            retStyle.color = 'gray';
            retStyle['background-color'] = 'transparent';
            retStyle['border-color'] = 'gray';
            retStyle['border-width.px'] = 2;
            retStyle['border-style'] = 'dotted';
        }
        return retStyle;
    }

    /***********************************************************************************************
     * fn          getAttrPosition
     *
     * brief
     *
     */
    getAttrPosition(keyVal: gIF.keyVal_t) {

        const attr = keyVal.value;

        if(attr.drag){
            return undefined;
        }

        return {
            x: attr.pos.x * this.imgDim.width,
            y: attr.pos.y * this.imgDim.height,
        };
    }

    /***********************************************************************************************
     * @fn          onDragEnded
     *
     * @brief
     *
     */
    onDragEnded(event: CdkDragEnd, keyVal: gIF.keyVal_t) {

        const attr = keyVal.value;

        attr.drag = false;
        event.source.element.nativeElement.style.zIndex = '1';

        const evtPos = event.source.getFreeDragPosition();
        let pos: gIF.nsPos_t = {
            x: evtPos.x / this.imgDim.width,
            y: evtPos.y / this.imgDim.height,
        };
        attr.pos = pos;

        this.storage.setAttrPos(pos, keyVal);
    }

    /***********************************************************************************************
     * @fn          onDragStarted
     *
     * @brief
     *
     */
    onDragStarted(event: CdkDragStart, keyVal: gIF.keyVal_t) {

        const attr = keyVal.value;

        attr.drag = true;
        event.source.element.nativeElement.style.zIndex = '10000';
    }

    /***********************************************************************************************
     * @fn          setStyles
     *
     * @brief
     *
     */
    setStyles(keyVal: gIF.keyVal_t) {

        this.startWait();
        setTimeout(()=>{
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = keyVal;
            dialogConfig.width = '350px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'set-styles-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(SetStyles, dialogConfig);
            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          setName
     *
     * @brief
     *
     */
    setName(keyVal: gIF.keyVal_t) {

        this.startWait();
        setTimeout(()=>{
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = keyVal;
            dialogConfig.width = '250px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'set-name-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(SetName, dialogConfig);
            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          setCorr
     *
     * @brief
     *
     */
    setCorr(keyVal: gIF.keyVal_t) {

        this.startWait();
        setTimeout(()=>{
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = keyVal;
            dialogConfig.width = '250px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'set-corr-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(SetCorr, dialogConfig);
            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          graph
     *
     * @brief
     *
     */
    graph(keyVal: gIF.keyVal_t) {

        this.startWait();
        setTimeout(()=>{
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = keyVal;
            dialogConfig.width = '70%';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'graph-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(Graph, dialogConfig);
            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          onEditScrollsClick
     *
     * @brief
     *
     */
    onEditScrollsClick() {

        this.startWait();
        setTimeout(()=>{
            const dlgData = {
                scrolls: JSON.parse(JSON.stringify(this.scrolls)),
                scrollRef: this.containerRef.nativeElement,
                imgDim: this.imgDim,
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.width = '250px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'edit-scrolls-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(EditScrolls, dialogConfig);

            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
            dlgRef.afterClosed().subscribe((data: gIF.scroll_t[]) => {
                if(data){
                    this.scrolls = data;
                    this.scrolls.unshift(dumyScroll);
                    this.storage.setScrolls(this.scrolls);
                    this.selScroll = this.scrolls[0];
                }
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          onEditScrollsClick
     *
     * @brief
     *
     */
    moveElement() {

        this.startWait();
        setTimeout(()=>{
            const dlgData = {
                scrolls: JSON.stringify(this.scrolls),
                containerRef: this.containerRef.nativeElement,
                imgDim: this.imgDim,
                selAttr: this.selAttr,
                dragRef: this.dragRef
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.width = '300px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'move-element-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(MoveElement, dialogConfig);

            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
            dlgRef.afterClosed().subscribe((data: gIF.scroll_t[]) => {
                if(data){
                    // ---
                }
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          editBinds
     *
     * @brief
     *
     */
    editBinds() {

        this.startWait();
        setTimeout(()=>{
            const dlgData = {
                partMap: this.partMap,
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'edit-binds-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(EditBinds, dialogConfig);

            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          editThermostats
     *
     * @brief
     *
     */
    editThermostats() {

        this.startWait();
        setTimeout(()=>{
            const dlgData = {
                partMap: this.partMap,
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'edit-thermostats-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(EditStats, dialogConfig);

            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          showLogs
     *
     * @brief
     *
     */
    showLogs() {

        this.startWait();
        setTimeout(()=>{
            const dlgData = {
                dummy: 10,
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.width = '65%';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'show-logs-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(ShowLogs, dialogConfig);
            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          showAbout
     *
     * @brief
     *
     */
    showAbout() {

        this.startWait();
        setTimeout(()=>{
            const dlgData = {
                attr: this.selAttr.value,
                partMap: this.partMap
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.width = '40%';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'show-about-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(About, dialogConfig);
            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * @fn          showSSR
     *
     * @brief
     *
     */
    showSSR() {

        this.startWait();
        setTimeout(()=>{
            const dlgData = {
                attr: this.selAttr.value
            };
            const dialogConfig = new MatDialogConfig();
            dialogConfig.data = dlgData;
            dialogConfig.width = '350px';
            dialogConfig.autoFocus = false;
            dialogConfig.disableClose = true;
            dialogConfig.panelClass = 'show-ssr-container';
            dialogConfig.restoreFocus = false;

            const dlgRef = this.matDialog.open(SSR, dialogConfig);
            dlgRef.afterOpened().subscribe(()=>{
                this.progressFlag = false;
            });
        }, 10);
    }

    /***********************************************************************************************
     * fn          scrollSelChange
     *
     * brief
     *
     */
    scrollSelChange(scroll){

        if(scroll.value){
            if(scroll.value.name !== gConst.DUMMY_SCROLL){
                const x = 0;
                const y = (scroll.value.yPos * this.imgDim.height) / 100;

                this.containerRef.nativeElement.scrollTo({
                    top: y,
                    left: x,
                    behavior: 'smooth'
                });
                setTimeout(() => {
                    this.selScroll = this.scrolls[0];
                }, 1000);
            }
        }
    }

    /***********************************************************************************************
     * fn          onResize
     *
     * brief
     *
     */
    onResize(event) {

        console.log(`with: ${window.innerWidth}`);

        const rect = event.contentRect;
        console.log(`w: ${rect.width}, h: ${rect.height}`);
        const el = this.floorPlanRef.nativeElement;

        this.imgDim.width = rect.width;
        this.imgDim.height = Math.round((rect.width / this.bkgImgWidth) * this.bkgImgHeight);
        this.ngZone.run(()=>{
            this.renderer.setStyle(el, 'height', `${this.imgDim.height}px`);
        });
    }

    /***********************************************************************************************
     * fn          tempEvent
     *
     * brief
     *
     */
    tempEvent(event: gIF.tempEvent_t){

        const key = this.storage.thermostatKey(event.extAddr, event.endPoint);
        const nvThermostat: gIF.thermostat_t = this.storage.nvThermostatsMap.get(key);
        if(nvThermostat){
            if(nvThermostat.actuators.length){
                let changed = false;
                if(nvThermostat.setPoint !== nvThermostat.prevSetPoint){
                    changed = true;
                    nvThermostat.prevSetPoint = nvThermostat.setPoint;
                    nvThermostat.workPoint = nvThermostat.setPoint - nvThermostat.hysteresis;
                }
                if(event.temp > nvThermostat.workPoint){
                    if(nvThermostat.workPoint > nvThermostat.setPoint){
                        changed = true;
                        nvThermostat.workPoint = nvThermostat.setPoint - nvThermostat.hysteresis;
                    }
                }
                if(event.temp < nvThermostat.workPoint){
                    if(nvThermostat.workPoint < nvThermostat.setPoint){
                        changed = true;
                        nvThermostat.workPoint = nvThermostat.setPoint + nvThermostat.hysteresis;
                    }
                }
                if(changed){
                    this.storage.storeThermostat(nvThermostat);
                }

                let cmd = 0x00; // OFF
                if(event.temp < nvThermostat.workPoint){
                    cmd = 0x01; // ON
                }
                for(const on_off of nvThermostat.actuators){
                    const zclCmd = {} as gIF.udpZclReq_t;
                    zclCmd.ip = on_off.ip;
                    zclCmd.port = on_off.port;
                    zclCmd.extAddr = on_off.extAddr;
                    zclCmd.endPoint = on_off.endPoint;
                    zclCmd.clusterID = gConst.CLUSTER_ID_GEN_ON_OFF;
                    zclCmd.hasRsp = 0;
                    zclCmd.cmdLen = 3;
                    zclCmd.cmd = [];
                    zclCmd.cmd[0] = 0x11; // cluster spec cmd, not manu spec, client to srv dir, disable dflt rsp
                    zclCmd.cmd[1] = 0x00; // seq num -> not used
                    zclCmd.cmd[2] = cmd;  // ON/OFF command
                    this.serialLink.udpZclCmd(JSON.stringify(zclCmd));
                }
            }
        }
    }

    /***********************************************************************************************
     * fn          startWait
     *
     * brief
     *
     */
    startWait(){

        this.progressFlag = true;
        this.waitMsg = 'wait...';
        /*
        this.msgIdx = 0;
        setTimeout(() => {
            this.incrWait()
        }, 250);
        */
    }

    /***********************************************************************************************
     * fn          incrWait
     *
     * brief
     *
     */
    incrWait(){

        if(this.progressFlag === true){
            let strArr = wait_msg.split('');
            strArr[this.msgIdx] = 'x';
            this.waitMsg = strArr.join('');
            this.msgIdx++;
            if(this.msgIdx === wait_msg.length){
                this.msgIdx = 0;
            }
            setTimeout(() => {
                this.incrWait()
            }, 250);
        }
    }

    /***********************************************************************************************
     * fn          mouseEnterAttr
     *
     * brief
     *
     */
    mouseEnterAttr(keyVal: gIF.keyVal_t){

        const attr = keyVal.value;
        const partDesc: gIF.part_t = this.partMap.get(attr.partNum);

        this.footerStatus  = `${attr.name}: `;
        this.footerStatus += `${partDesc.part}`;
        this.footerStatus += ` -> ${partDesc.devName}`;
        this.footerStatus += ` @ ${this.utils.extToHex(attr.extAddr)}`;
        clearTimeout(this.footerTmo);
        this.footerTmo = setTimeout(()=>{
            this.footerStatus = '';
        }, 5000);

    }

    /***********************************************************************************************
     * fn          mouseLeaveAttr
     *
     * brief
     *
     */
    mouseLeaveAttr(){
        this.footerStatus = '';
    }

    /***********************************************************************************************
     * fn          ctxMenuOpened
     *
     * brief
     *
     */
    ctxMenuOpened(keyVal: gIF.keyVal_t, dragRef: CdkDrag){

        this.dragRef = dragRef;
        this.selAttr = keyVal;
        const attr = keyVal.value;

        this.ctrlFlag = false;
        this.corrFlag = false;
        switch(attr.partNum){
            case gConst.ACUATOR_010_ON_OFF:
            case gConst.SSR_009_RELAY: {
                this.ctrlFlag = true;
                break;
            }
            case gConst.HTU21D_005_T:
            case gConst.HTU21D_005_RH: {
                this.corrFlag = true;
                break;
            }
        }
        this.graphFlag = false;
        if(attr.attrVals.length > 1){
            this.graphFlag = true;
        }
        this.moveFlag = false;
        if(this.scrolls.length > 2){
            this.moveFlag = true;
        }
    }

}
