import SyncPropsComponent from 'Component/syncpropscomponent';
import ElementProvider from 'Skeleton/elementprovider';
import * as Util from 'Skeleton/util';
import { Action } from  "Util/command";
import { Status, PositionStatus, NetworkStatus } from  "../playerstatus";
import { animation, animationAndComplete, animationWithDelay } from 'Skeleton/animation';
import Card from '../card'

class PlayerBody extends ElementProvider {
  writeHTML() {
    var cell = document.createElement("div");
    cell.id = this.id+'cell';
    cell.classList.add("player");
    cell.classList.add("player-position-wait");
    cell.innerHTML = `
      <div class='box'>
        <p id='${this.id}name' class='name'></p>
        <p id='${this.id}bankroll' class='bankroll'></p>
        <p id='${this.id}status' class='status'></p>
        <p id='${this.id}positionStatus' class='position-status'></p>
        <p id='${this.id}networkStatus' class='network-status'></p>
        <p id='${this.id}blind' class='blind'>B</p>
        <div id='${this.id}showDown' class='show-down'>
          <div id='${this.id}resultValue' class='result-value'></div>
        </div>
      </div>
      <div id='${this.id}timeBar' class='time-bar'></div>
      <div id='${this.id}action' class='action'></div>
    `;
    this.body.appendChild(cell);
  }
}



export default class Player extends SyncPropsComponent {
  constructor() {
    super();
    this.debuger.tag = 'Player';
    this.me = false;
    this.limitTime = 0;
    this.time = 0
    this.isShowDown = false;
    this.cards = [];
  }

  init(body, itsMe) {
    this.me = itsMe;
    return super.init(body);
  }
  remove() {
    super.remove();
    this.cards.forEach( c => c.remove() );
    this.showDown = null;
    this.name = null;
    this.bankroll = null;
    this.status = null;
    this.blind = null;
    this.timeBar = null;
    this.action = null;
    this.cards = null;
    this.resultValue = null;
    this.positionStatus = null;
    this.networkStatus = null;
  }

  getElementProvider() { return new PlayerBody(this.body); }
  onCreate(elementProvider) {

    this.name = elementProvider.getElement('name');
    this.bankroll = elementProvider.getElement('bankroll');
    this.networkStatus = elementProvider.getElement('networkStatus');
    this.positionStatus = elementProvider.getElement('positionStatus');
    this.status = elementProvider.getElement('status');
    this.action = elementProvider.getElement('action');
    this.blind = elementProvider.getElement('blind');
    this.timeBar = elementProvider.getElement('timeBar');
    this.showDown = elementProvider.getElement('showDown');
    this.resultValue = elementProvider.getElement('resultValue');
    this.resultValue.opacity = 0;
    this.showDown.opacity = 0;
    this.action.opacity = 0;
  }

  setupWatchs(){
    this.watchs = {
      name: value =>{
        this.name.innerHTML = value;
      },
      position: value =>{
        if( value != -1 ) this.onGameJoin();
      },
      bankroll: value =>{
        this.bankroll.innerHTML = '$' + value;
      },
      status: value =>{
        switch ( value ) {
          case Status.Wait:
            this.status.innerHTML = 'Wait'
            break;
          case Status.Impossible:
            this.status.innerHTML = 'Impossible'
            break;
          case Status.Fold:
            this.status.innerHTML = 'Fold'
            break;
          case Status.Play:
            this.status.innerHTML = 'Play'
            break;
          case Status.AllIn:
            this.status.innerHTML = 'AllIn'
            break;
          case Status.ShowDown:
            this.status.innerHTML = 'ShowDown'
            break;
          case Status.Absence:
            this.status.innerHTML = 'Absence'
            break;
          case Status.WaitBigBlind:
            this.status.innerHTML = 'WaitBigBlind'
            break;
        }
      },
      gameBet: value =>{
        //this.bet.innerHTML = 'GameBet -> ' + value;
      },
      time: value =>{
        this.time = value;
        if(this.limitTime > 0) this.timeBar.style.width =  Util.getStyleRatio( this.time/ this.limitTime * 100 );
      },
      limitTime: value =>{
        this.limitTime = value;
      },
      isBlind: value =>{
        this.blind.visible = value;
      },
      isWinner: value =>{
        this.action.innerHTML = value  ? 'Win' : '';
        animation(this.action, {scale:1, opacity:1});
      },

      isActive: value =>{
        value ? this.getBody().classList.add("player-active") : this.getBody().classList.remove("player-active")
      },
      resultValue: value =>{
        switch ( value ) {
          case Values.Highcard:
            this.resultValue.innerHTML = 'Highcard';
            break;
          case Values.Pair:
            this.resultValue.innerHTML = 'Pair';
            break;
          case Values.TwoPairs:
            this.resultValue.innerHTML = 'TwoPairs';
            break;
          case Values.ThreeOfAKind:
            this.resultValue.innerHTML = 'ThreeOfAKind';
            break;
          case Values.Straight:
            this.resultValue.innerHTML = 'Straight';
            break;
          case Values.FourOfAKind:
            this.resultValue.innerHTML = 'FourOfAKind';
            break;
          case Values.Flush:
            this.resultValue.innerHTML = 'Flush';
            break;
          case Values.FullHouse:
            this.resultValue.innerHTML = 'FullHouse';
            break;
          case Values.StraightFlush:
            this.resultValue.innerHTML = 'StraightFlush';
            break;
          case Values.RoyalStraightFlush:
            this.resultValue.innerHTML = 'RoyalStraightFlush';
            break;
          default:
            this.resultValue.innerHTML = '';
            animation( this.resultValue,{ opacity:0});
            return;
        }
        animation( this.resultValue,{ opacity:1});
      },

      finalAction: value =>{
        switch ( value ) {
          case Action.Fold:
            this.action.innerHTML = 'Fold'
            break;
          case Action.SmallBlind:
            this.action.innerHTML = 'SmallBlind'
            break;
          case Action.BigBlind:
            this.action.innerHTML = 'BigBlind'
            break;
          case Action.Check:
            this.action.innerHTML = 'Check'
            break;
          case Action.Call:
            this.action.innerHTML = 'Call'
            break;
          case Action.Bet:
            this.action.innerHTML = 'Bet'
            break;
          case Action.Raise:
            this.action.innerHTML = 'Raise'
            break;
          case Action.AllIn:
            this.action.innerHTML = 'AllIn'
            break;
        }
        this.viewAction();
      },
      networkStatus: value =>{
        switch ( value ) {
          case NetworkStatus.Connected:
            this.networkStatus.visible = false;
            break;
          case NetworkStatus.DisConnected:
            this.networkStatus.visible = true;
            this.networkStatus.innerHTML = 'out'
            break;
          case NetworkStatus.Wait:
            this.networkStatus.visible = true;
            this.networkStatus.innerHTML = 'wait'
            break;
        }
      },

      positionStatus: value =>{
        switch ( value ) {
          case PositionStatus.DeallerButton:
            this.positionStatus.innerHTML = 'DB';
            this.positionStatus.classList.add("db");
            this.positionStatus.visible = true;
            break;
          case PositionStatus.BigBlind:
            this.positionStatus.innerHTML = 'BB';
            this.positionStatus.classList.add("bb");
            this.positionStatus.visible = true;
            break;
          case PositionStatus.SmallBlind:
            this.positionStatus.innerHTML = 'SB';
            this.positionStatus.classList.add("sb");
            this.positionStatus.visible = true;
            break;
          case PositionStatus.None:
            this.positionStatus.innerHTML = ''
            this.positionStatus.classList.remove("db");
            this.positionStatus.classList.remove("sb");
            this.positionStatus.classList.remove("bb");
            this.positionStatus.visible = false;
            break;
        }
      }
    };
  }

  viewAction(){
    animationAndComplete(this.action, { opacity:1, scale:1 }, p => {
      animationWithDelay(this.action, { opacity:0, scale:1.5 }, 500)
    });
  }

  onGameJoin( ) {
    this.getBody().classList.remove("player-position-wait");
    this.getBody().classList.add("player-position-join");
    let margin = 5;
    let len = 5;
    let bounce = Util.convertRectFromDimension(this.getBody());

    var wid = ( bounce.width - ((len+1) * margin) ) / len;
    var hei = wid * 1.5;
    var tx = margin;
    var ty = (bounce.height - hei)/2;
    wid = Math.floor(wid);
    hei = Math.floor(hei);
    tx = Math.floor(tx);
    ty = Math.floor(ty);
    for(var i=0; i<len; ++i) {
      let card = new Card().init( this.showDown, wid, hei, tx ,margin);
      this.cards.push( card );
      card.visible = false;
      tx += (wid+margin)
    }
  }

  showCard( id, cardData ) {
    let idx = Number(id);
    let card = this.cards[ idx ];
    card.setData( cardData, true );
    card.burn();
    if(this.isShowDown) return;
    this.isShowDown = true;
    animation(this.showDown, { opacity:1 });
  }

  hideCard( id ) {
    let idx = Number(id);
    let card = this.cards[ idx ];
    card.hidden( true );
    if(!this.isShowDown) return;
    this.isShowDown = false;
    animation(this.showDown, { opacity:0});
  }
}

const Values = Object.freeze ({
  Highcard: 1,
  Pair: 2,
  TwoPairs: 3,
  ThreeOfAKind: 4,
  Straight: 5,
  FourOfAKind: 6,
  Flush: 7,
  FullHouse: 8,
  StraightFlush: 9,
  RoyalStraightFlush: 10
});
