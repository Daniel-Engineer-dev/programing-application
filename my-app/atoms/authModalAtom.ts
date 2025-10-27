import {atom} from "recoil"
type AuthModalState={
    isOpen: boolean;
    type:'login'|'register' | 'forgotPassword';
}