import Component from 'Skeleton/component';
import ElementProvider from 'Skeleton/elementprovider';
import * as Account from "ViewModel/account";
import * as Event from '../event'
import { UiAlert } from  "Util/message";

class RoomListBody extends ElementProvider {
  writeHTML() {
    var cell = document.createElement("div");
    cell.id = this.id+'cell';
    cell.classList.add("room-list");
    this.body.appendChild(cell);
  }
}

class ListItemBody extends ElementProvider {
  writeHTML() {
    var cell = document.createElement("div");
    cell.id = this.id+'cell';
    cell.classList.add("item");
    cell.innerHTML = `
      <div id='${this.id}text' class='text' ></div>
      <div id='${this.id}iconRock' class='icon-rock' ></div>
			<button id='${this.id}btn' class='btn'>Join</button>
    `;
    this.body.appendChild(cell);
  }
}

class ListData {
  constructor(lv, minBank) {
    this.lv = lv;
    this.minBank = minBank;
    this.isAble = false;
  }
}

export default class RoomList extends Component {
  constructor() {
    super();
    this.userInfo = null;
    this.datas = [];
    this.datas.push(new ListData(1,0));
    this.datas.push(new ListData(2,2000));
    this.datas.push(new ListData(3,5000));
    this.datas.push(new ListData(4,10000));
  }

  remove() {
    super.remove();
  }

  getElementProvider() { return new RoomListBody(this.body); }
  onCreate(elementProvider) {
    this.onCreateListItem();
  }

  onCreateListItem(){
    this.datas.forEach( (data) => {
      let item = new ListItem()
      item.data = data;
      item.init( this.getBody() ).subscribe ( e => { this.delegate.next(e) } );
    });
  }
}

class ListItem extends Component {
  constructor() {
    super();
  }

  remove() {
    super.remove();
    this.data = null;
    this.text = null;
    this.iconRock = null;
    this.btn = null;
  }

  getElementProvider() { return new ListItemBody(this.body); }
  onCreate(elementProvider) {
    this.text = elementProvider.getElement('text');
    this.iconRock = elementProvider.getElement('iconRock');
    this.btn = elementProvider.getElement('btn');
    this.text.innerHTML = "bank $"+this.data.minBank;
    this.getBody().classList.add("lv" + this.data.lv);
    if( Account.loginModel.info.bank >= this.data.minBank) this.data.isAble = true;

  }

  setupEvent() {
    Account.loginModel.delegate.subscribe ( info => {
        if(info.bank >= this.data.minBank){
           this.data.isAble = true;
           this.iconRock.visible = false;
           this.btn.visible = true;
        }else{
           this.data.isAble = false;
           this.iconRock.visible = true;
           this.btn.visible = false;
        }
    } );
    this.attachEvent(this.btn, "click", e => {
       if(!this.data.isAble){
         alert(UiAlert.DisableLv);
         return;
       }
       this.delegate.next(new ComponentEvent( EVENT.ROOM_EVENT.SELECTED_ROOM, this.data ));
    } );
  }

}