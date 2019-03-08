import * as Rx from 'rxjs';
import { take } from 'rxjs/operators';
import { nosync } from "colyseus";
import { Action } from  "../../util/command";
import Component from '../../skeleton/component'
import Event from  "../../util/event";

const GAME_SPEED:number = 1000;
const LIMIT_TIME:number = 30;
const BLIND_LIMIT_TIME:number = 5;

export const STAGE_EVENT = Object.freeze ({
	START_TURN: "startTurn",
	TIME_CHANGED: "timeChanged",
	LIMIT_TIME_CHANGED: "limitTimeChanged",
	NEXT_TURN: "nextTurn",
  CURRENT_PLAYER_CHANGED: "currentPlayerChanged",
	NEXT_ROUND: "nextRound"
});

export enum Status{
  Wait = 1,
  FreeFlop,
  Flop,
  Turn,
  ShowDown
}


export default class Stage extends Component {
  ante:number = 1;
  gameRule:number = 2;
  isLimited:boolean = false;
  status:Status;

  minBat:number;
  roundPot:number;
	gameBat:number;
	gamePot:number;

	@nosync
	time:number;
	@nosync
	startPlayer:number;
	@nosync
	playerBats:Array<number>;
  @nosync
  turn:number;
	@nosync
  count:number;
  @nosync
  ids:Array<String>;
  @nosync
  dellerID:string;
  @nosync
  delegate:Rx.Subject;
  @nosync
  gameScheduler:Rx.Observable;
  @nosync
  gameTimeSubscription:Rx.Subscription;
  @nosync
  didBat:boolean = false;
  @nosync
  smallBlindBat:number;
  @nosync
  bigBlindBat:number;
  @nosync
  minBankroll:number;

	@nosync
  memoryCount:number = 0;

  constructor(ante:number, gameRule:number) {
    super();
    this.ante = ante;
    this.gameRule = gameRule;
    this.smallBlindBat = ante * gameRule;
    this.bigBlindBat = this.smallBlindBat * 2;
    this.minBankroll = this.bigBlindBat + ante;
    this.status = Status.Wait;
    this.turn = 0;
    this.time = 0;
    this.delegate = null;
    this.gameScheduler = Rx.interval(GAME_SPEED);
  }

  remove() {
    super.remove();
    this.removeTimeSubscription();
    this.removeDelegate();
    this.gameTimeSubscription = null;
    this.gameScheduler = null;
    this.ids = null;
    this.positions = null;
		this.playerBats = null;
  }

  removeTimeSubscription() {
    if( this.gameTimeSubscription != null ) {
			this.memoryCount --;
			this.debuger.log(this.memoryCount, 'removeTimeSubscription');
			this.gameTimeSubscription.unsubscribe();
		}
    this.gameTimeSubscription = null;
  }

  removeDelegate() {
    if( this.delegate != null ) this.delegate.unsubscribe();
    this.delegate = null;
  }

  hasPlayer( id:string ):boolean {
    if( this.ids == null ) return false;
    if( this.ids.indexOf( id ) == -1 ) return false;
    return true;
  }

  reset(){
  	this.turn = 0;
    this.time = 0;
    this.status = Status.Wait;
    this.gameTimeSubscription = null;
    this.ids = null;
		this.playerBats = null;
		this.didBat = false;
		this.gameBat = 0;
		this.roundPot = 0;
		this.gamePot = 0;
		this.count = 0;
  }

  start(ids:Array):Rx.Subject {
    this.ids = ids;
		this.startPlayer = 0;
		this.playerBats = ids.map( id => 0 );
    this.delegate = new Rx.Subject();
    this.status = Status.FreeFlop;
    return this.delegate;
  }

  turnStart() {
    this.turnBat = 0;
    this.didBat = false;
    this.minBat = this.bigBlindBat;
		this.count = 1;
		this.startPlayer = 0;
		this.onTurnChange(1);
		this.turnNext();
  }

  turnNext() {
		this.memoryCount ++;
		this.debuger.log(this.memoryCount, 'turnNext');
    this.time = ( this.count == 1  || ( this.count == 2 && this.status == Status.FreeFlop )) ? BLIND_LIMIT_TIME : LIMIT_TIME;
		this.delegate.next( new Event( STAGE_EVENT.LIMIT_TIME_CHANGED , this.time ) );
    this.gameTimeSubscription = this.gameScheduler.pipe(take(LIMIT_TIME)).subscribe( {
      next :(t) => { this.onTime(); },
      complete :() => { this.onTurnComplete(); }
    });
  }

  onTime(){
    this.time--;
		this.delegate.next( new Event( STAGE_EVENT.TIME_CHANGED , this.time ) );
  }

  onTurnComplete() {
		this.debuger.log('onTurnComplete');
		this.removeTimeSubscription();
		this.count ++;
    let currentId = this.onTurnChange(this.turn + 1);
		if( this.startPlayer == this.turn ) this.delegate.next( new Event( STAGE_EVENT.NEXT_ROUND, currentId));
		else this.delegate.next( new Event( STAGE_EVENT.NEXT_TURN , currentId ) );
  }

	onTurnChange(turn:number):string {
		this.debuger.log('onTurnChange');
    this.turn = turn % this.ids.length;
		let id =  this.ids[this.turn];
		if( this.startPlayer != this.turn ) this.delegate.next( new Event( STAGE_EVENT.CURRENT_PLAYER_CHANGED , id) );
    return id;
  }

	batting(id:string, bat:number ){
		if( this.minBat < bat ) this.minBat = bat;
		let idx = this.ids.indexOf(id);
		this.playerBats[ idx ] += bat;
    this.gamePot += bat;
		this.roundPot += bat;
  }

	action( command: Command ):number {
		var bat = 0;
		var totalBat = this.playerBats[ this.turn ];
		switch(command.t) {
      case Action.Bat: this.didBat = true;
			case Action.Raise: this.startPlayer = this.turn;
			case Action.AllIn:
				bat = command.d;
				break;
			case Action.SmallBlind:	bat = this.smallBlindBat;	break;
			case Action.BigBlind: bat = this.bigBlindBat;	break;
      case Action.Fold: bat = 0; break;
			default: bat = this.gameBat - totalBat; break;
    }
		totalBat = bat + totalBat;
		if( totalBat > this.gameBat ) {
			this.gameBat = totalBat;
			this.startPlayer = this.turn;
			this.debuger.log(this.startPlayer, 'startPlayer changed');
		}
		return bat;
  }

  nextRound() {
    this.status ++;
		this.roundPot = 0;
		this.gameBat = 0;
		this.count = 0;
		this.didBat = false;
  }

	nextCheck() {
		this.debuger.log(this.status, 'nextCheck');
    if(this.status == Status.ShowDown) {
			this.delegate.complete();
			this.debuger.log(this.status, 'complete');
		}
    else {
			this.delegate.next( new Event( STAGE_EVENT.START_TURN , this.status ) );
			this.debuger.log(this.status, 'next');
		}
  }

	showDown( ){
		this.status = Status.ShowDown;
  }


  complete(){
		this.removeTimeSubscription();
    this.removeDelegate();
  }

	getCallBat():number {
    return this.gameBat - this.playerBats[ this.turn ];
  }

	getMainPot(id:string):number {
		let idx = this.ids.indexOf(id);
		let myBat =  this.playerBats[ idx ];
		let sum = (a, b) => a + ( (b > myBat) ? myBat : b );
		let pot = this.playerBats.reduce(sum,0);
    return pot;
  }

	getSidePot():number {
    return this.gamePot;
  }

  getActions():Array{
    if(this.status == Status.FreeFlop){
      if( this.count == 1 ) return [ Action.SmallBlind ];
      if( this.count == 2 ) return [ Action.BigBlind ];
    } else {
      if( this.count == 1 ) return [ Action.BigBlind ];
    }
    if( !this.didBat ) return [ Action.Bat, Action.Check, Action.Fold ];
    return [ Action.Raise, Action.Call, Action.Fold ];
  }


}
