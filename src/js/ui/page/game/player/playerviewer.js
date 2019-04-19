import SyncPropsComponent from 'Component/syncpropscomponent';
import ElementProvider from 'Skeleton/elementprovider';
import * as Util from 'Skeleton/util';
import Player from './player';
import Position from './position';
import { animationValue } from 'Skeleton/animation';

class PlayerViewerBody extends ElementProvider {
  writeHTML() {
  this.body.innerHTML = `
    `;
  }
}

class PlayerViewerInfo {
  constructor() {
    this.myPosition = 0;
    this.reset();
  }
  reset() {}
}

const POSITION_WIDTH = 371;
const POSITION_HEIGHT = 91;

export default class PlayerViewer extends SyncPropsComponent {
  constructor() {
    super();
    this.debuger.tag = 'PlayerViewer';
    this.info = new PlayerViewerInfo();
    this.players = {};
    this.positions = [];
  }

  remove() {
    super.remove();
    for (let id in this.players) this.players[id].remove();
    this.positions.forEach( p => { p.remove(); });
    this.players = null;
    this.positions = null;
  }

  getElementProvider() { return new PlayerViewerBody(this.body); }
  onCreate(elementProvider) {
  }

  setupWatchs(){
    this.watchs = {
      maxPlayer: value =>{
        this.onCreatePositions(value);
      }
    };
  }

  setupSyncProps(){
    let syncProps = { maxPlayer:0 };
    super.setupSyncProps(syncProps);
  }

  onCreatePositions( playerNum ){
    for(var i=0; i < playerNum; ++i) {
      let position = new Position();
      position.init( this.getBody() , i).subscribe ( this.onUiEvent.bind(this) );
      this.positions.push(position);
    }
    this.onResize();
  }

  onUiEvent(event) {
    this.delegate.next(event);
  }

  onResize(isAni = false) {
    let bounce = Util.convertRectFromDimension(this.getBody());
    let marginX = -150;
    let marginY = -80;
    let width = POSITION_WIDTH;
    let height = POSITION_HEIGHT;
    let centerX = bounce.width/2;
    let centerY = bounce.height/2;
    let posX = centerX - (width/2);
    let posY = centerY - (height/2);
    let radiusX = centerX - width - marginX;
    let radiusY = centerY - height - marginY;
    var posLen = this.positions.length;
    var len = posLen  + 1 ;
    var rotate = 90;
    var sumRotate = 360 / len;
    let start = this.info.myPosition;
    let end = len + start;
    let center = Math.ceil( posLen / 2 )
    let dealler = center + this.info.myPosition;
    var pos = this.info.myPosition;
    let dr = pos >= center;
    for(var i = start; i < end; ++ i){
      if( i != dealler) {
        let posIdx  = pos % posLen;
        let position = this.positions[ posIdx ];
        //position.btnJoin.innerHTML = "rotate : " + rotate;
        if(90 <= rotate && rotate < 270) {

          position.getBody().classList.remove("position-l");
          position.getBody().classList.add("position-r");
        }else{
          position.getBody().classList.remove("position-r");
          position.getBody().classList.add("position-l");
        }
        position.onResize(posX, posY, radiusX, radiusY);
        var r = rotate * Math.PI/180
        if(isAni){
          if(dr == true){
            if( r < position.rotate ) r += (Math.PI * 2);
          }else {
            if( r > position.rotate ) r -= (Math.PI * 2);
          }
          animationValue( position, "rotate", r );
        }else{
          position.rotate = r;
        }
        pos++;
      }
      rotate += sumRotate
    }
  }

  onJoin(id, syncProps, itsMe) {
    this.onCreatePlayer( id, syncProps, itsMe );
  }

  onCreatePlayer( id, syncProps, itsMe ){
    let player = new Player();
    player.init( this.getBody(), itsMe ).subscribe ( this.onUiEvent.bind(this) );
    player.onUpdateSyncProps( syncProps );
    this.players[id] = player;
  }

  onLeave(id) {
    let player = this.players[id];
    if( player == null ) return;
    player.remove();
    delete this.players[id]
    let position = this.positions[ player.position ];
    if( position != null) position.leavePlayer();
  }

  onUpdatePlayer(id, prop, value){
    let player = this.players[id];
    if( player == null ) return;

    if( prop == 'position') {
      let position = this.positions[ value ];
      if( position == null ) return;
      position.addPlayer( player.getBody() );
      if( player.me ) this.onSelectedMyposition( value );
      else position.joinPlayer();
    }
    player.onUpdateSyncProp( prop, value);
  }

  onSelectedMyposition( position ){
    this.positions.forEach( p => { p.joinPlayer(); } );
    this.info.myPosition = position;
    this.positions[ position ].visible = false;
    this.onResize(true);
  }

  onShowCard( id, idx, cardData ) {
    this.players[id].showCard( idx, cardData );
  }

  onHideCard( id, idx) {
    this.players[id].hideCard( idx );
  }

  getPlayerPositions(){
    return this.positions.map( p => {
      return { x:p.x+(POSITION_WIDTH/2), y:p.y+(POSITION_HEIGHT/2) }
    });
  }
}
