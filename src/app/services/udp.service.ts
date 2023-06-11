import { Injectable } from '@angular/core';
import { SerialLinkService } from './serial-link.service';
import { PortService } from './port.service';
import { UtilsService } from './utils.service';

import * as gConst from '../gConst';
import * as gIF from '../gIF';

const UDP_PORT = 22802;
const ANNCE_TMO = 3000;

@Injectable({
    providedIn: 'root',
})
export class UdpService {

    //private nwk;
    private dgram;
    udpSocket;

    msgBuf = window.nw.Buffer.alloc(1024);
    rwBuf = new gIF.rwBuf_t();

    constructor(private serial: SerialLinkService,
                private port: PortService,
                private utils: UtilsService) {
        this.rwBuf.wrBuf = this.msgBuf;
        //this.nwk = window.nw.require('network');
        this.dgram = window.nw.require('dgram');
        this.udpSocket = this.dgram.createSocket('udp4');
        this.udpSocket.on('message', (msg, rinfo)=>{
            this.udpOnMsg(msg, rinfo);
        });
        this.udpSocket.on('error', (err)=>{
            console.log(`server error:\n${err.stack}`);
        });
        this.udpSocket.on('listening', ()=>{
            let address = this.udpSocket.address();
            console.log(`server listening ${address.address}:${address.port}`);
        });
        this.udpSocket.bind(UDP_PORT, ()=>{
            this.udpSocket.setBroadcast(true);
        });

        setTimeout(()=>{
            this.bridgeAnnce();
        }, ANNCE_TMO);
    }

    /***********************************************************************************************
     * fn          closeSocket
     *
     * brief
     *
     */
    public closeSocket() {
        this.udpSocket.close();
    }

    /***********************************************************************************************
     * fn          udpOnMsg
     *
     * brief
     *
     */
    public udpOnMsg(msg, rem) {

        this.rwBuf.rdBuf = msg;
        //this.rwBuf.wrBuf = this.msgBuf;
        this.rwBuf.rdIdx = 0;
        this.rwBuf.wrIdx = 0;

        const pktFunc = this.rwBuf.read_uint16_LE();
        switch(pktFunc) {
            case gConst.BRIDGE_ID_REQ: {
                let rnd = Math.floor(Math.random() * 100) + 50;
                setTimeout(()=>{
                    this.rwBuf.write_uint16_LE(gConst.BRIDGE_ID_RSP);
                    const len = this.rwBuf.wrIdx;
                    this.udpSocket.send(this.msgBuf.subarray(0, len), 0, len, rem.port, rem.address, (err)=>{
                        if(err) {
                            console.log('UDP ERR: ' + JSON.stringify(err));
                        }
                    });
                }, rnd);
                break;
            }
            case gConst.ON_OFF_ACTUATORS: {
                this.rwBuf.write_uint16_LE(pktFunc);
                const startIdx = this.rwBuf.read_uint16_LE();
                this.rwBuf.write_uint16_LE(startIdx);
                const numIdx = this.rwBuf.wrIdx;
                let numVals = 0;
                this.rwBuf.write_uint16_LE(numVals);
                const doneIdx = this.rwBuf.wrIdx;
                this.rwBuf.write_uint8(1); // done field
                let valIdx = 0;
                for(let attrSet of this.serial.setMap.values()) {
                    if(attrSet.clusterID == gConst.CLUSTER_ID_GEN_ON_OFF) {
                        if(valIdx >= startIdx) {
                            numVals++;
                            this.rwBuf.write_uint32_LE(attrSet.partNum);
                            this.rwBuf.write_double_LE(attrSet.extAddr);
                            this.rwBuf.write_uint8(attrSet.endPoint);
                            this.rwBuf.write_uint8(attrSet.setVals.state);
                            this.rwBuf.write_uint8(attrSet.setVals.level);
                            this.rwBuf.write_uint8(attrSet.setVals.name.length);
                            for(let i = 0; i < attrSet.setVals.name.length; i++) {
                                this.rwBuf.write_uint8(attrSet.setVals.name.charCodeAt(i));
                            }
                            this.rwBuf.write_uint32_LE(this.utils.ipToLong(attrSet.ip));
                            this.rwBuf.write_uint16_LE(attrSet.port);
                        }
                        valIdx++;
                    }
                    if(this.rwBuf.wrIdx > 500) {
                        this.rwBuf.modify_uint8(0, doneIdx);
                        break; // exit for-loop
                    }
                }
                if(numVals) {
                    this.rwBuf.modify_uint16_LE(numVals, numIdx);
                }
                const len = this.rwBuf.wrIdx;
                this.udpSocket.send(this.msgBuf.subarray(0, len), 0, len, rem.port, rem.address, (err)=>{
                    if(err) {
                        console.log('UDP ERR: ' + JSON.stringify(err));
                    }
                });
                break;
            }
            case gConst.T_SENSORS: {
                this.rwBuf.write_uint16_LE(pktFunc);
                const startIdx = this.rwBuf.read_uint16_LE();
                this.rwBuf.write_uint16_LE(startIdx);
                const numIdx = this.rwBuf.wrIdx;
                let numVals = 0;
                this.rwBuf.write_uint16_LE(numVals);
                let doneIdx = this.rwBuf.wrIdx;
                this.rwBuf.write_uint8(1);
                let valIdx = 0;
                for(let attrSet of this.serial.setMap.values()) {
                    if(attrSet.clusterID == gConst.CLUSTER_ID_MS_TEMPERATURE_MEASUREMENT) {
                        if(valIdx >= startIdx) {
                            numVals++;
                            this.rwBuf.write_uint32_LE(attrSet.partNum);
                            this.rwBuf.write_double_LE(attrSet.extAddr);
                            this.rwBuf.write_uint8(attrSet.endPoint);
                            this.rwBuf.write_int16_LE(10 * attrSet.setVals.t_val);
                            this.rwBuf.write_uint16_LE(attrSet.setVals.units);
                            this.rwBuf.write_uint8(attrSet.setVals.name.length);
                            for(let i = 0; i < attrSet.setVals.name.length; i++) {
                                this.rwBuf.write_uint8(attrSet.setVals.name.charCodeAt(i));
                            }
                        }
                        valIdx++;
                    }
                    if(this.rwBuf.wrIdx > 500) {
                        this.rwBuf.modify_uint8(0, doneIdx);
                        break; // exit for-loop
                    }
                }
                if(numVals) {
                    this.rwBuf.modify_uint16_LE(numVals, numIdx);
                }
                const len = this.rwBuf.wrIdx;
                this.udpSocket.send(this.msgBuf.subarray(0, len), 0, len, rem.port, rem.address, (err)=>{
                    if(err) {
                        console.log('UDP ERR: ' + JSON.stringify(err));
                    }
                });
                break;
            }
            case gConst.RH_SENSORS: {
                this.rwBuf.write_uint16_LE(pktFunc);
                let startIdx = this.rwBuf.read_uint16_LE();
                this.rwBuf.write_uint16_LE(startIdx);
                let numIdx = this.rwBuf.wrIdx;
                let numVals = 0;
                this.rwBuf.write_uint16_LE(numVals);
                let doneIdx = this.rwBuf.wrIdx;
                this.rwBuf.write_uint8(1);
                let valIdx = 0;
                for(let attrSet of this.serial.setMap.values()) {
                    if(attrSet.clusterID == gConst.CLUSTER_ID_MS_RH_MEASUREMENT) {
                        if(valIdx >= startIdx) {
                            numVals++;
                            this.rwBuf.write_uint32_LE(attrSet.partNum);
                            this.rwBuf.write_double_LE(attrSet.extAddr);
                            this.rwBuf.write_uint8(attrSet.endPoint);
                            this.rwBuf.write_uint16_LE(10 * attrSet.setVals.rh_val);
                            this.rwBuf.write_uint8(attrSet.setVals.name.length);
                            for(let i = 0; i < attrSet.setVals.name.length; i++) {
                                this.rwBuf.write_uint8(attrSet.setVals.name.charCodeAt(i));
                            }
                        }
                        valIdx++;
                    }
                    if(this.rwBuf.wrIdx > 500) {
                        this.rwBuf.modify_uint8(0, doneIdx);
                        break; // exit for-loop
                    }
                }
                if(numVals) {
                    this.rwBuf.modify_uint16_LE(numVals, numIdx);
                }
                const len = this.rwBuf.wrIdx;
                this.udpSocket.send(this.msgBuf.subarray(0, len), 0, len, rem.port, rem.address, (err)=>{
                    if(err) {
                        console.log('UDP ERR: ' + JSON.stringify(err));
                    }
                });
                break;
            }
            default:
                // ---
                break;
        }
    }

    /***********************************************************************************************
     * fn          bridgeAnnce
     *
     * brief
     *
     */
    bridgeAnnce() {
        if(this.port.bcastIP){
            this.msgBuf.writeUInt16LE(gConst.BRIDGE_ID_RSP, 0);
            this.udpSocket.send(this.msgBuf.subarray(0, 2), 0, 2, UDP_PORT, this.port.bcastIP, (err)=>{
                if(err) {
                    console.log('UDP ERR: ' + JSON.stringify(err));
                }
            });
        }
        /*
        this.nwk.get_gateway_ip((err, ip)=>{
            if(!err){
                const bcastIP  = ip.split('.');
                bcastIP[3] = '255';
                const ipStr = bcastIP.join('.');
                this.msgBuf.writeUInt16LE(gConst.BRIDGE_ID_RSP, 0);
                this.udpSocket.send(this.msgBuf.subarray(0, 2), 0, 2, UDP_PORT, ipStr, (err)=>{
                    if(err) {
                        console.log('UDP ERR: ' + JSON.stringify(err));
                    }
                });
            }
        })
        */
        setTimeout(()=>{
            this.bridgeAnnce();
        }, ANNCE_TMO);
    }
}
