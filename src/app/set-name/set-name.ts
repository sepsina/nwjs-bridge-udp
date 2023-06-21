import { Component, OnInit, Inject, AfterViewInit, NgZone, OnDestroy, ViewChild, ElementRef, HostListener, AfterContentInit } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { StorageService } from '../services/storage.service';
import { Validators, FormControl } from '@angular/forms';
import { EventsService } from '../services/events.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as gConst from '../gConst';
import * as gIF from '../gIF'

@Component({
    selector: 'app-name',
    templateUrl: './set-name.html',
    styleUrls: ['./set-name.scss'],
})
export class SetName implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild('attrName') attrName: ElementRef;

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
    selAttr: gIF.hostedAttr_t;

    nameFormCtrl: FormControl;

    constructor(public dialogRef: MatDialogRef<SetName>,
                @Inject(MAT_DIALOG_DATA) public keyVal: any,
                public events: EventsService,
                public serialLink: SerialLinkService,
                public ngZone: NgZone,
                public storage: StorageService) {
        this.selAttr = this.keyVal.value;
    }

    ngOnDestroy(): void {
        // ---
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.attrName.nativeElement.focus();
            this.attrName.nativeElement.select();
        }, 0);
    }

    ngOnInit() {

        this.name = this.selAttr.name;
        this.nameFormCtrl = new FormControl(
            this.name, [Validators.required]
        );
    }

    async save() {
        this.name = this.nameFormCtrl.value;
        this.storage.setAttrName(this.name,
                                 this.keyVal);
        this.dialogRef.close();
    }

    close() {
        this.dialogRef.close();
    }

    nameErr() {
        if(this.nameFormCtrl.hasError('required')){
            return 'You must enter a value';
        }
    }

    /***********************************************************************************************
     * @fn          isValid
     *
     * @brief
     *
     */
    isValid(){
        if(this.nameFormCtrl.invalid){
            return false;
        }
        return true;
    }

}
