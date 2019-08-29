import { Subject } from 'rxjs';
import ComponentEvent from 'Skeleton/event';
import Debugger from 'Skeleton/log';
import * as Api from 'Root/api';
import uuidv4 from 'uuid/v4';

export const EVENT = Object.freeze ({
	LOGIN: "login",
  LOGOUT: "logout",
  ON_PROFILE: "onProfile",
	ON_PLAY_DATA: "onPlayData",
	ON_UNREGISTERED: "onUnregistered",
  ERROR: "error",
  PROGRESS: "progress"
});

export const Status = Object.freeze ({
	Login: "login",
  Logout: "logout"
});

class UserInfo {
  constructor() {
    this.reset();
		this.debuger = new Debugger();
		this.debuger.tag = 'UserInfo';
  }

  reset() {
    this.name = '';
    this.id = '';
		this.rid = "";
		this.bank= -1;
		this.rank = -1;
    this.accessToken = '';
		this.profileImg = "";
  }

  setData(data) {
		this.name = data.name;
		this.id = data.id;
		this.profileImg = data.profileImg;
		this.debuger.log( this, 'setData');
  }

	setPlayData(data) {
	  this.rid = data['@rid'];
		this.bank= data.bank;
		this.rank = data.rank;
  }

  getStatus() {
    return this.accessToken == "" ? Status.Logout : Status.Login;
  }
}

class LoginModel {
  constructor() {
    this.delegate = new Subject();
    this.info = new UserInfo();
		this.debuger = new Debugger();
		this.debuger.tag = 'LoginModel';
  }

  remove() {
    this.delegate.complete(this);
    this.delegate = null;
    this.info = null;
  }

  getUserData() {
    return this.info;
  }

  getStatus() {
    return this.info.getStatus();
  }

  login () {
    this.delegate.next(new ComponentEvent( EVENT.PROGRESS));
		this.debuger.log("FBLogin", 'login');
		FB.login( (response) => {
			this.debuger.log(response, 'login');
      ( response.status === 'connected' ) ? this.onLogin(response.authResponse.accessToken) : this.onLoginError();
    }, {scope: 'public_profile,email'});
    return this.delegate;
  }

	signUp () {
    this.delegate.next(new ComponentEvent( EVENT.PROGRESS));
		this.debuger.log('signUp');
		Api.signUp(this.info.id, {
			profileImg:this.info.profileImg,
			name:this.info.name,
			snsToken:this.info.accessToken
		}).subscribe(
	    response => {
				this.info.setPlayData(response.data.data);
				this.delegate.next(new ComponentEvent( EVENT.ON_PLAY_DATA, this.info));
			},
	    error => this.onLoginError( error.response.data )
	  );
    return this.delegate;
  }

  getProFile () {
    this.delegate.next(new ComponentEvent( EVENT.PROGRESS));
		FB.api('/me', (response) => {
      this.info.setData(response)
      this.delegate.next(new ComponentEvent( EVENT.ON_PROFILE, this.info));
    });
    return this.delegate;
  }

	getPlayData () {

		this.delegate.next(new ComponentEvent( EVENT.PROGRESS));
		Api.getUser(this.info.id, this.info.rid).subscribe(
	    response => {
				this.info.setPlayData(response.data.data);
				this.delegate.next(new ComponentEvent( EVENT.ON_PLAY_DATA, this.info));
			},
	    error => this.onLoginError( error.response.data )
	  );
		return this.delegate;
	}

  logout () {
    FB.logout();
    this.info.reset();
    this.delegate.next(new ComponentEvent( EVENT.LOGOUT ));
  }

  onLogin(accessToken) {
    this.info.accessToken = accessToken;
    this.delegate.next(new ComponentEvent( EVENT.LOGIN, accessToken));
    this.getProFile();
  }

  onLoginError(data) {
		if(data == null) {
			this.delegate.next(new ComponentEvent( EVENT.ERROR));
			return;
		}

		if(data.code === Api.ErrorCode.UnregisteredData) this.delegate.next(new ComponentEvent( EVENT.ON_UNREGISTERED));
    else this.delegate.next(new ComponentEvent( EVENT.ERROR));
  }
}

export const loginModel = new LoginModel();
