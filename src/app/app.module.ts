import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { SetStyles } from "./set-styles/set-styles.page";
import { SetName } from './set-name/set-name';
import { SetCorr } from './set-corr/set-corr';
import { EditScrolls } from "./edit-scrolls/edit-scrolls";
import { EditFreeDNS } from "./edit-freeDNS/edit-freeDNS";
import { ShowLogs } from './logs/show-logs';
import { About } from './about/about';
import { EditBinds } from "./binds/binds.page";
import { EditStats } from './x-stat/x_stat.page';
import { HighlightSel } from "./directives/highlight-sel.directive";
import { ResizeObserverDirective } from './directives/resize-observer.directive';
import { SSR } from './ssr/ssr';
import { Graph } from './graph/graph';

import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { HttpClientModule } from '@angular/common/http';
import { AngularMaterialModule } from './angular-material/angular-material.module';

import { CdkMenuModule } from '@angular/cdk/menu';
import { NgChartsModule } from 'ng2-charts';

@NgModule({
    declarations: [
        AppComponent,
        SetStyles,
        SetName,
        SetCorr,
        EditScrolls,
        EditFreeDNS,
        ShowLogs,
        About,
        EditBinds,
        EditStats,
        HighlightSel,
        ResizeObserverDirective,
        SSR,
        Graph
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BrowserModule,
        AppRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        AngularMaterialModule,
        CdkMenuModule,
        NgChartsModule
    ],
    providers: [],
    bootstrap: [AppComponent],
    entryComponents:[]
})
export class AppModule {
}
