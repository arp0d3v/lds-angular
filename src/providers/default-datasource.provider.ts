import { Inject, Injectable } from "@angular/core";
import { ListDataSourceProvider } from "./datasource.provider";
import { HttpClient } from "@angular/common/http";
import { Injectable } from '@angular/core';
import { LdsConfig } from '@arp0d3v/lds-core';

@Injectable()
export class DefaultListDataSourceProvider extends ListDataSourceProvider {
    constructor(private _http: HttpClient, @Inject('ldsConfig') private ldsConfig: LdsConfig) {
        super(ldsConfig);
    }
    override httpGet(dataSourceUrl: string, queryString: string, body: any, callBack: ((result: any) => any)): void {
        const URL = dataSourceUrl + '?' + queryString;
        this._http.get<any>(URL).subscribe(result => {
            callBack(result);
        }, err => {
            callBack({ items: [], total: 0 });
        });
    }
    override httpPost(dataSourceUrl: string, queryString: string, body: any, callBack: ((result: any) => any)): void {
        const URL = dataSourceUrl;
        this._http.post<any>(URL, body).subscribe(result => {
            callBack(result);
        }, err => {
            callBack({ items: [], total: 0 });
        });
    }


}