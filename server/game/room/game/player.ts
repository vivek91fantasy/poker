import Command from "../../util/command";
import Component from '../../skeleton/component'
import { Action, checkCommand } from  "../../util/command";
import { JoinOption } from "../../util/interface";
import { nosync } from "colyseus";

export default class Player extends Component {
  status:Status = Status.Absence;
  bankroll:number = 1000;
  isBlind:boolean = false;
  userId:string;
  name:string;
  position:number = -1;
  isDealler:boolean = false;
  isActive:boolean = false;
  networkStatus:NetworkStatus;
  gameBat:number = 0;
  mainPot:number = 0;
  time:number = 0;
  limitTime:number = 0;
  openHand:Array;

  actionBlind:boolean = false;
  actionFold:boolean = false;
  actionSmallBlind:boolean = false;
  actionBigBlind:boolean = false;
  actionCheck:boolean = false;
  actionCall:boolean = false;
  actionBat:boolean = false;
  actionRaise:boolean = false;
  actionAllin:boolean = false;

  @nosync
  currentBlindAction:number = -1;
  @nosync
  id:string;
  @nosync
  hand:Array;
  @nosync
  isActionComplete:boolean = false;


  constructor(id:stirng, options:JoinOption) {
    super();
    this.id = id;
    this.name = options.name;
    this.userId = options.userId;
    this.networkStatus = NetworkStatus.Connected;
  }

  remove() {
    super.remove();
    this.hand = null;
    this.openHand = null;
  }

  isConnected():boolean {
    if(this.networkStatus == NetworkStatus.DisConnected) return false;
    return true;
  }

  waiting(){
    this.networkStatus = NetworkStatus.Wait;
  }

  isJoinGameAble(){
    return this.status == Status.WaitBigBlind || this.status == Status.Absence;
  }

  joinGame( position:number, isPlaying:boolean){
    this.position = position;
    this.status = isPlaying ? Status.WaitBigBlind : Status.Wait;
  }

  isRejoinAble():boolean {
    return this.networkStatus == NetworkStatus.Wait;
  }

  reJoin(){
    this.networkStatus = NetworkStatus.Connected;
  }

  leave(){
    this.networkStatus = NetworkStatus.DisConnected;
    this.status = Status.Absence;
  }

  isPlayAble(minBankroll:number, posIdx:int):boolean {
    if( this.networkStatus != NetworkStatus.Connected ) return false;
    if( this.status == Status.Absence ) return false;
    if( this.status == Status.WaitBigBlind && posIdx != 2 ) return false;
    if( minBankroll > this.bankroll ) {
      this.status = Status.Impossible;
      return false;
    }
    return true;
  }
  isActionAble():boolean {
    if( this.status == Status.Play ) return true;
    return false;
  }

  isNextAble():boolean {
    if( this.status == Status.Play ) return true;
    if( this.status == Status.AllIn ) return true;
    return false;
  }

  startDisable () {
    if( this.status != Status.Absence) this.status = Status.Wait
  }

  reset(){
    this.hand = null;
    if( this.status != Status.Absence & this.status != Status.WaitBigBlind ) this.status = Status.Wait;
    this.isBlind = false;
    this.isDealler = false;
    this.time = 0;
    this.mainPot = 0;
    this.gameBat = 0;
    this.currentBlindAction = -1;
    this.actionBlind = true;
    this.resetAction();
  }

  resetAction() {
    this.actionFold = false;
    this.actionSmallBlind = false;
    this.actionBigBlind = false;
    this.actionCheck = false;
    this.actionCall = false;
    this.actionBat = false;
    this.actionRaise = false;
    this.actionAllin = false;
  }

  start(hand:Array) {
    this.hand = hand;
    this.openHand = [];
    this.actionBlind = false;
    this.status = Status.Play;
  }

  nextRound() {
    this.gameBat = 0;
    this.resetAction();
  }

  batting(amount:number):boolean{
    this.gameBat += amount;
    this.bankroll -= amount;
    return true;
  }

  action (command: Command) {
    switch(command.t) {
      case Action.Fold: this.status = Status.Fold; break;
      case Action.Raise: this.status = Status.Play; break;
      case Action.Check: this.status = Status.Play; break;
      case Action.Call: this.status = Status.Play; break;
      case Action.Bat: this.status = Status.Play; break;
      case Action.AllIn: this.status = Status.AllIn; break;
      case Action.SmallBlind: this.status = Status.Play; break;
      case Action.BigBlind: this.status = Status.Play; break;
    }
    this.time = 0;
    this.checkBat = 0;
    this.resetAction();
    this.isActionComplete = true;
  }

  showDown(){
    if(this.status == Status.Impossible || this.status == Status.Wait) return;
    this.resetAction();
    this.status = Status.ShowDown;
    this.openHand = this.hand;
  }

  setActivePlayer(action:Array,call:number, minBat:number){

    let bat = call + minBat;
    let isBlindAc = false;
    let currentAction = action.map( ac => {
      switch(ac){
        case Action.Check:
        case Action.Call:
          if( call >= this.bankroll) return Action.AllIn;
          break;
        case Action.SmallBlind:
        case Action.BigBlind: isBlindAc = true;
        case Action.Bat:
        case Action.Raise:
          if( bat >= this.bankroll) return Action.AllIn;
          break;
      }
      return ac;
    });

    currentAction.forEach( ac => {
      switch(ac){
        case Action.Fold: this.actionFold = true; break;
        case Action.SmallBlind: this.actionSmallBlind = true; break;
        case Action.BigBlind: this.actionBigBlind = true; break;
        case Action.Check: this.actionCheck = true; break;
        case Action.Call: this.actionCall = true; break;
        case Action.Bat: this.actionBat = true; break;
        case Action.Raise: this.actionRaise = true; break;
        case Action.AllIn: this.actionAllIn = true; break;
      }
    }) ;

    this.currentBlindAction = isBlindAc ? currentAction[0] : -1;
    this.isActive = true;
    this.isActionComplete = false;
  }

  setPassivePlayer(){
    this.isActive = false;
    this.time = 0;
    this.limitTime = 0;
    if( !this.isActionComplete ) this.status = Status.Fold;
  }

  blindGame(){
    this.isBlind = !this.isBlind;
  }


}

enum Status{
  Wait = 1,
  Impossible,
  Fold,
	Play,
  AllIn,
  ShowDown,
  Absence,
  WaitBigBlind
}

enum NetworkStatus{
  Connected = 1,
  DisConnected,
  Wait
}
