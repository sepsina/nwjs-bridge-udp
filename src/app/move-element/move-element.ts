import { Component, OnInit, Inject, AfterViewInit, NgZone, OnDestroy, HostListener } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { StorageService } from '../services/storage.service';
import { EventsService } from '../services/events.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { CdkDrag } from '@angular/cdk/drag-drop';

import * as gConst from '../gConst';
import * as gIF from '../gIF'


@Component({
    selector: 'app-move-element',
    templateUrl: './move-element.html',
    styleUrls: ['./move-element.scss'],
})
export class MoveElement implements OnInit, AfterViewInit, OnDestroy {

    @HostListener('document:keyup', ['$event'])
    handleKeyboardEvent(event: KeyboardEvent) {
        switch(event.key){
            case 'Escape': {
                this.close();
                break;
            }
        }
    }

    name: string;
    scrolls: gIF.scroll_t[] = [];
    selScroll: gIF.scroll_t;
    selAttr = {} as gIF.keyVal_t;
    containerRef: any;
    imgDim = {} as gIF.imgDim_t;
    dragRef: CdkDrag;
    prevPos: any;
    startFlag = true;

    constructor(public dialogRef: MatDialogRef<MoveElement>,
                @Inject(MAT_DIALOG_DATA) public dlgData: any,
                public events: EventsService,
                public serialLink: SerialLinkService,
                public ngZone: NgZone,
                public storage: StorageService) {
        // ---
    }

    ngOnInit() {
        // ---
    }

    ngOnDestroy(): void {
        // ---
    }

    ngAfterViewInit(): void {

        setTimeout(() => {
            this.selAttr = this.dlgData.selAttr;
            this.containerRef = this.dlgData.containerRef;
            this.name = `${this.selAttr.value.name}`;
            this.selAttr.value.drag = true;

            this.imgDim.height = this.dlgData.imgDim.height;
            this.imgDim.width = this.dlgData.imgDim.width;

            this.dragRef = this.dlgData.dragRef;
            this.prevPos = this.dragRef.getFreeDragPosition();

            this.scrolls = JSON.parse(this.dlgData.scrolls);
            this.scrolls[0].name = 'move to'
            this.selScroll = this.scrolls[0];
        }, 0);
    }

    /***********************************************************************************************
     * fn          scrollSelChange
     *
     * brief
     *
     */
    scrollSelChange(scroll){

        if(this.startFlag == true){
            this.startFlag = false;
            this.scrolls.shift();
        }
        if(scroll.value){
            const x = 0;
            const y = (scroll.value.yPos * this.imgDim.height) / 100;

            this.containerRef.scrollTo({
                top: y,
                left: x,
                behavior: 'smooth'
            });

            this.dragRef.setFreeDragPosition({x: x, y: y});
        }
    }

    /***********************************************************************************************
     * fn          save
     *
     * brief
     *
     */
    save() {

        const evtPos = this.dragRef.getFreeDragPosition();
        let pos: gIF.nsPos_t = {
            x: evtPos.x / this.imgDim.width,
            y: evtPos.y / this.imgDim.height,
        };
        this.selAttr.value.pos = pos;
        this.storage.setAttrPos(pos, this.selAttr);
        this.selAttr.value.drag = false;

        this.dialogRef.close();
    }

    /***********************************************************************************************
     * fn          close
     *
     * brief
     *
     */
    close() {

        this.selAttr.value.drag = false;

        this.dialogRef.close();
    }

}
