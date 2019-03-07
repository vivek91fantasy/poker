import SyncPropsComponent from 'Component/syncpropscomponent';
import ElementProvider from 'Skeleton/elementprovider';
import * as Util from 'Skeleton/util';

class PlayerBody extends ElementProvider {
  writeHTML() {
    var cell = document.createElement("div");
    cell.id = this.id+'cell';
    cell.classList.add("player");
    cell.classList.add("player-position-wait");
    cell.innerHTML = `
      <img id='${this.id}profileImg' class='profile-img'></img>
      <p id='${this.id}profileData' class='profile-data'></p>
      <p id='${this.id}playData' class='play-data'></p>
      <p id='${this.id}status' class='status'></p>
      <div id='${this.id}timeBar' class='time-bar'></div>
    `;
    this.body.appendChild(cell);
  }
}

export default class Player extends SyncPropsComponent {
  constructor() {
    super();
    this.debuger.tag = 'Player';
    this.me = false;
  }

  init(body, itsMe) {
    this.me = itsMe;
    return super.init(body);
  }
  remove() {
    super.remove();
    this.profileImg = null;
    this.profileData = null;
    this.playData = null;
    this.status = null;
    this.timeBar = null;
  }

  setupWatchs(){
    this.watchs = {
      status: value =>{
        this.debuger.log(value, 'status');
        this.status.innerHTML = 'player -> ' + value;
      },
      bankroll: value =>{
        this.debuger.log(value, 'bankroll');
      },
      isBlind: value =>{
        this.debuger.log(value, 'isBlind');
      },
      userId: value =>{
        this.debuger.log(value, 'userId');
      },
      name: value =>{
        this.debuger.log(value, 'name');
        this.profileData.innerHTML = value;
      },
      position: value =>{
        if(value != -1) this.onGameJoin();
        this.playData.innerHTML = 'pos -> ' + value;
        this.debuger.log(value, 'position');
      },
      isActive: value =>{
        this.debuger.log(value, 'isActive');
      },
      networkStatus: value =>{
        this.debuger.log(value, 'networkStatus');
      }
    };
  }

  getElementProvider() { return new PlayerBody(this.body); }
  onCreate(elementProvider) {
    this.profileImg = elementProvider.getElement('profileImg');
    this.profileData = elementProvider.getElement('profileData');
    this.playData = elementProvider.getElement('playData');
    this.status = elementProvider.getElement('status');
    this.timeBar = elementProvider.getElement('timeBar');
    this.profileData.innerHTML = this.idx + ' : player out'
    if ( this.me ) this.getBody().classList.add("player-me");
  }

  onGameJoin( ) {
    this.getBody().classList.remove("player-position-wait");
    this.getBody().classList.add("player-position-join");
  }
}


export const Status = Object.freeze ({
  Wait: 1,
  Impossible: 2,
  Fold: 3,
	Play: 4,
  AllIn: 5,
  ShowDown: 6
});

export const NetworkStatus = Object.freeze ({
  Connected: 1,
  DisConnected: 2,
  Wait: 3
});