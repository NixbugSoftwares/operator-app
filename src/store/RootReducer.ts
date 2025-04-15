import { combineReducers } from '@reduxjs/toolkit';
import { AppReducer, AuthReducer } from '../slices';



export default combineReducers({
    app: AppReducer,
    auth: AuthReducer
})