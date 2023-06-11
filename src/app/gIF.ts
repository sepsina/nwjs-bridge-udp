
export enum eRxState {
    E_STATE_RX_WAIT_START,
    E_STATE_RX_WAIT_TYPELSB,
    E_STATE_RX_WAIT_TYPEMSB,
    E_STATE_RX_WAIT_LENLSB,
    E_STATE_RX_WAIT_LENMSB,
    E_STATE_RX_WAIT_CRC,
    E_STATE_RX_WAIT_DATA
}

export interface rdHost_t {
    queue: number[];
    busy: boolean;
    tmoRef: any;
    rdType: string;
    idx: number;
    retryCnt: number;
}

export interface slCmd_t {
    seqNum: number;
    ttl: number;
    cmdID: number;
    hostShortAddr: number;
    ip: string;
    port: number;
}

export interface dataHost_t {
    shortAddr: number;
    extAddr: number;
    numAttrSets: number;
    numSrcBinds: number;
}
export interface attrSet_t {
    ip: string;
    port: number;
    hostShortAddr: number;
    partNum: number;
    clusterServer: number;
    extAddr: number;
    shortAddr: number;
    endPoint: number;
    clusterID: number;
    attrSetID: number;
    attrMap: number;
    valsLen: number;
    attrVals: number[];
}
export interface attrSpec_t {
    attrID: number;
    isVisible: boolean;
    isSensor: boolean;
    hasHistory: boolean;
    formatedVal: string;
    timestamp: number;
    attrVal: number;
}
export interface nsPos_t {
    x: number;
    y: number;
}
export interface ngStyle_t {
    color: string;
    bgColor: string;
    fontSize: number;
    //border: string;
    borderWidth: number;
    borderStyle: string;
    borderColor: string;
    borderRadius: number;
    paddingTop: number;
    paddingRight: number;
    paddingBottom: number;
    paddingLeft: number;
}
export interface valCorr_t{
    units: number;
    slope: number;
    offset: number;
}

export interface hostedSet_t {
    timestamp: number;
    ip: string;
    port: number;
    hostShortAddr: number;
    partNum: number;
    extAddr: number;
    shortAddr: number;
    endPoint: number;
    clusterID: number;
    attrSetID: number;
    setVals: any;
}

export interface hostedAttr_t {
    drag: boolean;
    isSel: boolean;
    timestamp: number;
    pos: nsPos_t;
    name: string;
    style: ngStyle_t;
    valCorr: valCorr_t;
    ip: string;
    port: number;
    hostShortAddr: number;
    partNum: number;
    clusterServer: number;
    extAddr: number;
    shortAddr: number;
    endPoint: number;
    clusterID: number;
    attrSetID: number;
    attrID: number;
    isValid: boolean;
    isSensor:boolean;
    formatedVal: string;
    timestamps: number[];
    attrVals: number[];
}

export interface attrKey_t {
    shortAddr: number;
    endPoint: number;
    clusterID: number;
    attrSetID: number;
    attrID: number;
}

export interface storedAttr_t {
    attrName: string;
    pos: nsPos_t;
    style: ngStyle_t;
    valCorr: valCorr_t;
}

export interface bindDst_t {
    dstExtAddr: number;
    dstEP: number;
}
export interface hostedBind_t {
    timestamp: number;
    ip: string;
    port: number;
    name: string;
    partNum: number;
    hostShortAddr: number;
    extAddr: number;
    srcShortAddr: number;
    srcEP: number;
    clusterID: number;
    dstExtAddr: number;
    dstEP: number;
}
export interface clusterBind_t {
    ip: string;
    port: number;
    partNum: number;
    hostShortAddr: number;
    extAddr: number;
    srcShortAddr: number;
    srcEP: number;
    clusterID: number;
    dstExtAddr: number;
    dstEP: number;
}
export interface bind_t {
    valid: boolean;
    ip: string;
    port: number;
    partNum: number;
    extAddr: number;
    name: string;
    clusterID: number;
    shortAddr: number;
    endPoint: number;
}

export interface storedBind_t {
    bindName: string;
}

export interface descVal_t {
    key: string;
    value: string
}

export  interface partDesc_t {
    partNum: number;
    devName: string;
    part: string;
    url: string;
}

export  interface part_t {
    devName: string;
    part: string;
    url: string;
}

export interface scroll_t {
    name: string;
    yPos: number;
}

export interface usbId_t {
    pid: number;
    vid: number;
}

export interface udpZclReq_t {
    ip: string;
    port: number;
    extAddr: number;
    endPoint: number;
    clusterID: number;
    hasRsp: number;
    cmdLen: number;
    cmd: number[]
}

export interface dns_t {
    user: string;
    psw: string;
    domain: string;
    token: string;
}

export interface slMsg_t {
    type: number;
    data: number[];
}

export interface hostCmd_t {
    shortAddr: number;
    type: number;
    idx: number;
    retryCnt: number;
    param:string;
}
/*
export interface udpCmd_t {
    seqNum: number;
    ttl: number;
    cmdID: number;
    hostShortAddr: number;
    ip: string;
    port: number;
}
*/
export interface imgDim_t {
    width: number;
    height: number;
}

export interface workerCmd_t {
    type: number;
    cmd: any;
}

export interface thermostatActuator_t {
    name: string;
    ip: string;
    port: number;
    extAddr: number;
    endPoint: number;
}

export interface thermostat_t {
    name: string;
    ip: string;
    port: number;
    partNum: number;
    extAddr: number;
    setPoint: number;
    prevSetPoint: number;
    workPoint: number;
    hysteresis: number;
    shortAddr: number;
    endPoint: number;
    actuators: thermostatActuator_t[];
}

export interface on_off_actuator_t {
    valid: boolean
    name: string;
    ip: string;
    port: number;
    partNum: number;
    extAddr: number;
    shortAddr: number;
    endPoint: number;
}

export interface tempEvent_t {
    temp: number;
    extAddr: number;
    endPoint: number;
}

export interface msgLogs_t {
    text: string;
    color: string;
    id: number;
}

export interface udpCmd_t {
    type: number;
    retryCnt: number;
    param:string;
}

export interface rdAtIdxParam_t {
    ip: string;
    port: number;
    shortAddr: number;
    idx: number;
}

export class rwBuf_t {

    rdIdx: number;
    wrIdx: number;

    rdBuf: any;
    wrBuf: any;

    constructor(){

    }

    /***********************************************************************************************
     * fn          read_uint8
     *
     * brief
     *
     */
    read_uint8(){
        const val = this.rdBuf.readUInt8(this.rdIdx);
        this.rdIdx += 1;
        return val;
    }

    /***********************************************************************************************
     * fn          read_uint16_LE
     *
     * brief
     *
     */
    read_uint16_LE(){
        const val = this.rdBuf.readUInt16LE(this.rdIdx);
        this.rdIdx += 2;
        return val;
    }
    /***********************************************************************************************
     * fn          read_uint32_LE
     *
     * brief
     *
     */
    read_uint32_LE(){
        const val = this.rdBuf.readUInt32LE(this.rdIdx);
        this.rdIdx += 4;
        return val;
    }
    /***********************************************************************************************
     * fn          read_double_LE
     *
     * brief
     *
     */
    read_double_LE(){
        const val = this.rdBuf.readDoubleLE(this.rdIdx);
        this.rdIdx += 8;
        return val;
    }

    /***********************************************************************************************
     * fn          write_uint8
     *
     * brief
     *
     */
    write_uint8(val: number){
        this.wrBuf.writeUInt8(val, this.wrIdx);
        this.wrIdx += 1;
    }

    /***********************************************************************************************
     * fn          modify_uint8
     *
     * brief
     *
     */
    modify_uint8(val: number, idx: number){
        this.wrBuf.writeUInt8(val, idx);
    }

    /***********************************************************************************************
     * fn          write_uint16_LE
     *
     * brief
     *
     */
    write_uint16_LE(val: number){
        this.wrBuf.writeUInt16LE(val, this.wrIdx);
        this.wrIdx += 2;
    }

    /***********************************************************************************************
     * fn          write_int16_LE
     *
     * brief
     *
     */
    write_int16_LE(val: number){
        this.wrBuf.writeInt16LE(val, this.wrIdx);
        this.wrIdx += 2;
    }

    /***********************************************************************************************
     * fn          modify_uint16_LE
     *
     * brief
     *
     */
    modify_uint16_LE(val: number, idx: number){
        this.wrBuf.writeUInt16LE(val, idx);

    }

    /***********************************************************************************************
     * fn          write_uint32_LE
     *
     * brief
     *
     */
    write_uint32_LE(val: number){
        this.wrBuf.writeUInt32LE(val, this.wrIdx);
        this.wrIdx += 4;
    }

    /***********************************************************************************************
     * fn          write_double_LE
     *
     * brief
     *
     */
    write_double_LE(val: number){
        this.wrBuf.writeDoubleLE(val, this.wrIdx);
        this.wrIdx += 8;
    }
}





