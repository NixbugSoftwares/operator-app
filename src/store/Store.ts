import { createStore, applyMiddleware, compose } from '@reduxjs/toolkit'
import * as thunk from 'redux-thunk';
import logger from 'redux-logger'
import RootReducer from './RootReducer';



const configureStore = (initialState: object) => {
    const enhance = compose(applyMiddleware(thunk.thunk, logger))
    return createStore(RootReducer, initialState, enhance);
}

const store = configureStore({});

export default store;

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch