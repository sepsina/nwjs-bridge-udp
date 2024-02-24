import { Injectable } from '@angular/core';
import { EventsService } from './events.service';
import { UtilsService } from './utils.service';
import * as gConst from '../gConst';
import * as gIF from '../gIF';

const UDP_PORT = 18870;

interface lastAnnce_t {
    ext: number;
    time: number;
}

@Injectable({
    providedIn: 'root',
})
export class PortService {

    private udpCmdQueue: gIF.udpCmd_t[] = [];
    private udpCmdFlag = false;
    private udpCmdTmoRef;
    private runTmoRef = null;

    private dgram: any;
    udpSocket: any;
    bcastIP = '';

    private seqNum = 0;
    udpCmd = {} as gIF.udpCmd_t;

    private msgBuf = window.nw.Buffer.alloc(256);

    rwBuf = new gIF.rwBuf_t();

    lastAnnceArr: lastAnnce_t[] = [];

    constructor(private events: EventsService,
                private utils: UtilsService) {
        this.rwBuf.wrBuf = this.msgBuf;

        setTimeout(()=>{
            this.cleanAgedAnnce();
        }, 1000);

        this.events.subscribe('wr_bind', (bind)=>{
            this.wrBind(bind);
        });
        this.events.subscribe('zcl_cmd', (cmd)=>{
            this.udpZclCmd(cmd);
        });

        this.dgram = window.nw.require('dgram');
        this.udpSocket = this.dgram.createSocket('udp4');
        this.udpSocket.on('message', (msg, rinfo)=>{
            this.processMsg(msg, rinfo);
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
     * fn          processMsg
     *
     * brief
     *
     */
    private processMsg(msg, rem) {

        this.rwBuf.rdBuf = msg;
        this.rwBuf.rdIdx = 0;

        const cmdID = this.rwBuf.read_uint16_LE();
        switch(cmdID) {
            case gConst.SL_MSG_HOST_ANNCE: {
                const dataHost = {} as gIF.dataHost_t;
                dataHost.shortAddr = this.rwBuf.read_uint16_LE();
                dataHost.extAddr = this.rwBuf.read_double_LE();
                dataHost.numAttrSets = this.rwBuf.read_uint8();
                dataHost.numSrcBinds = this.rwBuf.read_uint8();

                const duplFlag = this.checkDuplicate(dataHost.extAddr);
                if(duplFlag === true){
                    return;
                }
                else {
                    const lastAnnce: lastAnnce_t = {
                        ext: dataHost.extAddr,
                        time: new Date().getTime()
                    }
                    this.lastAnnceArr.push(lastAnnce);
                }

                setTimeout(() => {
                    let log = 'host ->';
                    log += ` short: 0x${dataHost.shortAddr.toString(16).padStart(4, '0').toUpperCase()},`;
                    log += ` ext: ${this.utils.extToHex(dataHost.extAddr)},`;
                    log += ` numAttr: ${dataHost.numAttrSets},`;
                    log += ` numBinds: ${dataHost.numSrcBinds}`;
                    this.utils.sendMsg(log);
                }, 5);
                this.bcastIP = this.utils.bcastIP(rem.address);

                if(this.udpCmdQueue.length > 15) {
                    this.udpCmdQueue = [];
                    this.udpCmdFlag = false;
                }
                const param: gIF.rdAtIdxParam_t = {
                    ip: rem.address,
                    //port: rem.port,
                    port: UDP_PORT,
                    shortAddr: dataHost.shortAddr,
                    idx: 0,
                }
                if(dataHost.numAttrSets > 0) {
                    let cmd: gIF.udpCmd_t = {
                        type: gConst.RD_ATTR,
                        retryCnt: gConst.RD_HOST_RETRY_CNT,
                        param: JSON.stringify(param),
                    };
                    this.udpCmdQueue.push(cmd);
                }
                if(dataHost.numSrcBinds > 0) {
                    let cmd: gIF.udpCmd_t = {
                        type: gConst.RD_BIND,
                        retryCnt: gConst.RD_HOST_RETRY_CNT,
                        param: JSON.stringify(param),
                    };
                    this.udpCmdQueue.push(cmd);
                }
                if(this.udpCmdQueue.length > 0) {
                    if(this.udpCmdFlag === false) {
                        this.udpCmdFlag = true;
                        this.runCmd();
                    }
                    if(this.runTmoRef === null) {
                        this.runTmoRef = setTimeout(()=>{
                            this.runTmoRef = null;
                            this.udpCmdFlag = true;
                            this.runCmd();
                        }, 3000);
                    }
                }
                break;
            }
            case gConst.SL_MSG_READ_ATTR_SET_AT_IDX: {
                const rxSet = {} as gIF.attrSet_t;
                const msgSeqNum = this.rwBuf.read_uint8();
                if(msgSeqNum == this.seqNum) {
                    const param: gIF.rdAtIdxParam_t = JSON.parse(this.udpCmd.param);
                    rxSet.hostShortAddr = param.shortAddr;
                    rxSet.ip = param.ip;
                    rxSet.port = param.port;
                    const status = this.rwBuf.read_uint8();
                    if(status == gConst.SL_CMD_OK) {
                        const memIdx = this.rwBuf.read_uint8();
                        rxSet.partNum = this.rwBuf.read_uint32_LE();
                        rxSet.clusterServer = this.rwBuf.read_uint8();
                        rxSet.extAddr = this.rwBuf.read_double_LE();
                        rxSet.shortAddr = this.rwBuf.read_uint16_LE();
                        rxSet.endPoint = this.rwBuf.read_uint8();
                        rxSet.clusterID = this.rwBuf.read_uint16_LE();
                        rxSet.attrSetID = this.rwBuf.read_uint16_LE();
                        rxSet.attrMap = this.rwBuf.read_uint16_LE();
                        rxSet.valsLen = this.rwBuf.read_uint8();
                        rxSet.attrVals = [];
                        for(let i = 0; i < rxSet.valsLen; i++) {
                            rxSet.attrVals[i] = this.rwBuf.read_uint8();
                        }
                        this.events.publish('attr_set', rxSet);

                        param.idx = memIdx + 1;
                        this.udpCmd.param = JSON.stringify(param);
                        this.udpCmd.retryCnt = gConst.RD_HOST_RETRY_CNT;
                        this.udpCmdQueue.push(this.udpCmd);
                        this.runCmd();
                    }
                    else {
                        if(this.udpCmdQueue.length > 0) {
                            this.runCmd();
                        }
                        else {
                            this.seqNum = ++this.seqNum % 256;
                            clearTimeout(this.udpCmdTmoRef);
                            this.udpCmdFlag = false;
                        }
                    }
                }
                break;
            }
            case gConst.SL_MSG_READ_BIND_AT_IDX: {
                const rxBind = {} as gIF.clusterBind_t;
                const msgSeqNum = this.rwBuf.read_uint8();
                if(msgSeqNum == this.seqNum) {
                    const param: gIF.rdAtIdxParam_t = JSON.parse(this.udpCmd.param);
                    rxBind.hostShortAddr = param.shortAddr;
                    rxBind.ip = param.ip;
                    rxBind.port = param.port;
                    const status = this.rwBuf.read_uint8();
                    if(status == gConst.SL_CMD_OK) {
                        const memIdx = this.rwBuf.read_uint8();
                        rxBind.partNum = this.rwBuf.read_uint32_LE();
                        rxBind.extAddr = this.rwBuf.read_double_LE();
                        rxBind.srcShortAddr = this.rwBuf.read_uint16_LE();
                        rxBind.srcEP = this.rwBuf.read_uint8();
                        rxBind.clusterID = this.rwBuf.read_uint16_LE();
                        rxBind.dstExtAddr = this.rwBuf.read_double_LE();
                        rxBind.dstEP = this.rwBuf.read_uint8();
                        this.events.publish('cluster_bind', rxBind);

                        param.idx = memIdx + 1;
                        this.udpCmd.param = JSON.stringify(param);
                        this.udpCmd.retryCnt = gConst.RD_HOST_RETRY_CNT;
                        this.udpCmdQueue.push(this.udpCmd);
                        this.runCmd();
                    }
                    else {
                        if(this.udpCmdQueue.length > 0) {
                            this.runCmd();
                        }
                        else {
                            this.seqNum = ++this.seqNum % 256;
                            clearTimeout(this.udpCmdTmoRef);
                            this.udpCmdFlag = false;
                        }
                    }
                }
                break;
            }
            case gConst.SL_MSG_WRITE_BIND: {
                const msgSeqNum = this.rwBuf.read_uint8();
                if(msgSeqNum == this.seqNum) {
                    let status = this.rwBuf.read_uint8();
                    if(status == gConst.SL_CMD_OK) {
                        this.utils.sendMsg('wr binds status: OK');
                    }
                    else {
                        this.utils.sendMsg('wr binds status: FAIL');
                    }
                    if(this.udpCmdQueue.length > 0) {
                        this.runCmd();
                    }
                    else {
                        this.seqNum = ++this.seqNum % 256;
                        clearTimeout(this.udpCmdTmoRef);
                        this.udpCmdFlag = false;
                    }
                }
                break;
            }
            case gConst.SL_MSG_ZCL_CMD: {
                const msgSeqNum = this.rwBuf.read_uint8();
                if(msgSeqNum == this.seqNum) {
                    // ---
                    if(this.udpCmdQueue.length > 0) {
                        this.runCmd();
                    }
                    else {
                        this.seqNum = ++this.seqNum % 256;
                        clearTimeout(this.udpCmdTmoRef);
                        this.udpCmdFlag = false;
                    }
                }
                break;
            }
            default: {
                console.log('unsupported sl command!');
                break;
            }
        }
    }

    /***********************************************************************************************
     * fn          runHostCmd
     *
     * brief
     *
     */
    private runCmd() {

        clearTimeout(this.udpCmdTmoRef);

        if(this.runTmoRef) {
            clearTimeout(this.runTmoRef);
            this.runTmoRef = null;
        }
        this.udpCmd = this.udpCmdQueue.shift();
        if(this.udpCmd) {
            switch(this.udpCmd.type) {
                case gConst.RD_ATTR: {
                    this.reqAttrAtIdx();
                    break;
                }
                case gConst.RD_BIND: {
                    this.reqBindAtIdx();
                    break;
                }
                case gConst.WR_BIND: {
                    this.wrBindReq();
                    break;
                }
                case gConst.ZCL_CMD: {
                    this.zclReq();
                    break;
                }
                default: {
                    //---;
                    break;
                }
            }
        }
        this.udpCmdTmoRef = setTimeout(()=>{
            this.udpCmdTmo();
        }, gConst.RD_HOST_TMO);
    }

    /***********************************************************************************************
     * fn          hostCmdTmo
     *
     * brief
     *
     */
    private udpCmdTmo() {

        this.utils.sendMsg('--- TMO ---', 'red');

        if(this.udpCmd.retryCnt) {
            this.udpCmd.retryCnt--;
            this.udpCmdQueue.push(this.udpCmd);
        }
        if(this.udpCmdQueue.length == 0) {
            this.udpCmdFlag = false;
            return;
        }
        this.udpCmd = this.udpCmdQueue.shift();
        switch (this.udpCmd.type) {
            case gConst.RD_ATTR: {
                this.reqAttrAtIdx();
                break;
            }
            case gConst.RD_BIND: {
                this.reqBindAtIdx();
                break;
            }
            case gConst.WR_BIND: {
                this.wrBindReq();
                break;
            }
            case gConst.ZCL_CMD: {
                this.zclReq();
                break;
            }
            default: {
                //---
                break;
            }
        }
        this.udpCmdTmoRef = setTimeout(()=>{
            this.udpCmdTmo();
        }, gConst.RD_HOST_TMO);
    }

    /***********************************************************************************************
     * fn          reqAttrAtIdx
     *
     * brief
     *
     */
    private reqAttrAtIdx() {

        const param: gIF.rdAtIdxParam_t = JSON.parse(this.udpCmd.param);
        this.seqNum = ++this.seqNum % 256;
        this.rwBuf.wrIdx = 0;

        this.rwBuf.write_uint16_LE(gConst.SL_MSG_READ_ATTR_SET_AT_IDX);
        const lenIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(0);
        // cmd data
        const dataStartIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(this.seqNum);
        this.rwBuf.write_uint16_LE(param.shortAddr);
        this.rwBuf.write_uint8(param.idx);

        const dataLen = this.rwBuf.wrIdx - dataStartIdx;
        this.rwBuf.modify_uint8(dataLen, lenIdx);

        this.udpSend(this.rwBuf.wrIdx, param.ip, param.port);
    }

    /***********************************************************************************************
     * fn          reqBindsAtIdx
     *
     * brief
     *
     */
    private reqBindAtIdx() {

        const param: gIF.rdAtIdxParam_t = JSON.parse(this.udpCmd.param);
        this.seqNum = ++this.seqNum % 256;
        this.rwBuf.wrIdx = 0;

        this.rwBuf.write_uint16_LE(gConst.SL_MSG_READ_BIND_AT_IDX);
        const lenIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(0);
        // cmd data
        const dataStartIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(this.seqNum);
        this.rwBuf.write_uint16_LE(param.shortAddr);
        this.rwBuf.write_uint8(param.idx);

        const dataLen = this.rwBuf.wrIdx - dataStartIdx;
        this.rwBuf.modify_uint8(dataLen, lenIdx);

        this.udpSend(this.rwBuf.wrIdx, param.ip, param.port);
    }

    /***********************************************************************************************
     * fn          wrBinds
     *
     * brief
     *
     */
    wrBind(bind: gIF.hostedBind_t) {
        let cmd: gIF.udpCmd_t = {
            type: gConst.WR_BIND,
            retryCnt: gConst.RD_HOST_RETRY_CNT,
            param: JSON.stringify(bind),
        };
        this.udpCmdQueue.push(cmd);
        if(this.udpCmdFlag == false) {
            this.udpCmdFlag = true;
            this.runCmd();
        }
    }

    /***********************************************************************************************
     * fn          wrBindsReq
     *
     * brief
     *
     */
    private wrBindReq() {

        const req: gIF.hostedBind_t = JSON.parse(this.udpCmd.param);
        this.seqNum = ++this.seqNum % 256;

        this.rwBuf.wrIdx = 0;
        this.rwBuf.write_uint16_LE(gConst.SL_MSG_WRITE_BIND);
        const lenIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(0);
        // cmd data
        const dataStartIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(this.seqNum);
        this.rwBuf.write_uint16_LE(req.hostShortAddr);
        this.rwBuf.write_double_LE(req.extAddr);
        this.rwBuf.write_uint8(req.srcEP);
        this.rwBuf.write_uint16_LE(req.clusterID);
        this.rwBuf.write_double_LE(req.dstExtAddr);
        this.rwBuf.write_uint8(req.dstEP);

        const dataLen = this.rwBuf.wrIdx - dataStartIdx;
        this.rwBuf.modify_uint8(dataLen, lenIdx);

        this.udpSend(this.rwBuf.wrIdx, req.ip, req.port);
    }

    /***********************************************************************************************
     * fn          udpZclCmd
     *
     * brief
     *
     */
    udpZclCmd(zclCmd: gIF.udpZclReq_t) {
        let cmd: gIF.udpCmd_t = {
            type: gConst.ZCL_CMD,
            retryCnt: 0,
            param: JSON.stringify(zclCmd),
        };
        this.udpCmdQueue.push(cmd);
        if(this.udpCmdFlag == false) {
            this.udpCmdFlag = true;
            this.runCmd();
        }
    }

    /***********************************************************************************************
     * fn          zclReq
     *
     * brief
     *
     */
    private zclReq() {

        const req: gIF.udpZclReq_t = JSON.parse(this.udpCmd.param);
        this.seqNum = ++this.seqNum % 256;

        this.rwBuf.wrIdx = 0;
        this.rwBuf.write_uint16_LE(gConst.SL_MSG_ZCL_CMD);
        const lenIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(0);
        // cmd data
        const dataStartIdx = this.rwBuf.wrIdx;
        this.rwBuf.write_uint8(this.seqNum);
        this.rwBuf.write_double_LE(req.extAddr);
        this.rwBuf.write_uint8(req.endPoint);
        this.rwBuf.write_uint16_LE(req.clusterID);
        this.rwBuf.write_uint8(req.hasRsp);
        this.rwBuf.write_uint8(req.cmdLen);
        for(let i = 0; i < req.cmdLen; i++) {
            this.rwBuf.write_uint8(req.cmd[i]);
        }

        const dataLen = this.rwBuf.wrIdx - dataStartIdx;
        this.rwBuf.modify_uint8(dataLen, lenIdx);

        this.udpSend(this.rwBuf.wrIdx, req.ip, req.port);
    }

    /***********************************************************************************************
     * fn          udpSend
     *
     * brief
     *
     */
    private udpSend(len: number, ip: string, port: number) {
        this.udpSocket.send(this.msgBuf.subarray(0, len), 0, len, port, ip, (err)=>{
            if(err) {
                console.log('UDP ERR: ' + JSON.stringify(err));
            }
        });
    }

    /***********************************************************************************************
     * fn          checkDuplicate
     *
     * brief
     *
     */
    private checkDuplicate(ext: number): boolean {

        let duplFlag = false;

        let i = this.lastAnnceArr.length;
        while(i--){
            if(this.lastAnnceArr[i].ext === ext) {
                duplFlag = true;
                break;
            }
        }
        return duplFlag;
    }

    /***********************************************************************************************
     * fn          cleanAgedAnnce
     *
     * brief
     *
     */
    private cleanAgedAnnce() {

        const now = new Date().getTime();

        let i = this.lastAnnceArr.length;
        while(i--){
            const dTime = now - this.lastAnnceArr[i].time;
            if(dTime > 2500){
                this.lastAnnceArr.splice(i, 1);
            }
        }
        setTimeout(()=>{
            this.cleanAgedAnnce();
        }, 1000);
    }

}
