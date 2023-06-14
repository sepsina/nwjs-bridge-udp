import { Component, OnInit, Inject, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { SerialLinkService } from '../services/serial-link.service';
import { StorageService } from '../services/storage.service';
import { Validators, FormControl } from '@angular/forms';
import { EventsService } from '../services/events.service';
import { UtilsService } from '../services/utils.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as gConst from '../gConst';
import * as gIF from '../gIF'
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
    selector: 'app-graph',
    templateUrl: './graph.html',
    styleUrls: ['./graph.scss'],
})
export class Graph implements OnInit, AfterViewInit, OnDestroy {

    @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

    selAttr: gIF.hostedAttr_t;
    duration = '';

    constructor(public dialogRef: MatDialogRef<Graph>,
                @Inject(MAT_DIALOG_DATA) public keyVal: any,
                public events: EventsService,
                public serialLink: SerialLinkService,
                public utils: UtilsService,
                public storage: StorageService) {
        this.selAttr = this.keyVal.value;
    }

    lineChartData: ChartConfiguration<'line'> ['data'] = {
        labels: [],
        datasets: [
            {
                data: [],
                //label: 'temp',
                fill: false,
                borderColor: 'black',
                cubicInterpolationMode: 'monotone',
                pointHitRadius: 20
            },
            /*
            {
                data: [],
                label: 'lin reg',
                fill: false,
                borderColor: 'red',
                borderDash: [8, 4],
                borderWidth: 2,
                cubicInterpolationMode: 'monotone',
            }
            */
        ]
    };
    public lineChartOptions: ChartOptions<'line'> = {
        responsive: true,
        //borderColor: 'blue',
        hover: {
            mode: 'nearest',
            intersect: true
        },
        scales: {
            x: {
                border: {
                    color: 'lightgray'
                },
                grid: {
                    display: false
                },
                ticks: {
                    autoSkip: false,
                    display: false,
                    maxRotation: 0,
                    font: {
                        size: 14,
                        //family: 'Verdana'
                    }
                }
            },
            y: {
                border: {
                    dash: [8, 4],
                    color: 'lightgray'
                },
                grid: {
                    //tickColor: 'red',
                    color: 'lightgray',
                    display: true,
                },
                ticks:{
                    //maxTicksLimit: 6,
                    font: {
                        size: 14,
                        //family: 'Verdana'
                    }
                },
                /*
                title: {
                    display: true,
                    text: 'temperatures',
                    font: {
                        size: 14,
                    }
                },
                */
                grace: 1,
            }
        },
        elements: {
            point:{
                radius: 0
            }
        },
        animation: {
            duration: 0
        }
    };

    public lineChartLegend = false;

    /***********************************************************************************************
     * fn          ngOnDestroy
     *
     * brief
     *
     */
    ngOnDestroy(): void {
        // ---
    }

    /***********************************************************************************************
     * fn          ngAfterViewInit
     *
     * brief
     *
     */
    ngAfterViewInit(): void {
        // ---

    }

    /***********************************************************************************************
     * fn          ngOnInit
     *
     * brief
     *
     */
    ngOnInit() {

        this.lineChartData.labels = [];
        this.lineChartData.datasets[0].data = [];

        const len = this.selAttr.timestamps.length;
        const start = this.selAttr.timestamps[0];
        for(let i = 0; i < len; i++){
            this.lineChartData.labels[i] = this.utils.secToTime(this.selAttr.timestamps[i] - start);
            this.lineChartData.datasets[0].data[i] = this.selAttr.attrVals[i];
        }
        const timeSpan = this.selAttr.timestamps[len - 1] - this.selAttr.timestamps[0];
        this.duration = `${this.utils.secToTime(timeSpan)}`;
        /*
        let i = 0;
        for(i = 0; i < 100; i++){
            this.lineChartData.labels[i] = this.utils.secToTime(i);
            this.lineChartData.datasets[0].data[i] = i;
        }
        this.duration = `${this.utils.secToTime(100)}`;
        */
        setTimeout(() => {
            this.chart.update();
            console.log(this.chart);
        }, 100);

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

}
