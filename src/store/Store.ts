import { createStore, applyMiddleware, compose } from '@reduxjs/toolkit'
import * as thunk from 'redux-thunk';
// import CommonHelper from '../helpers/commonHelper';
import logger from 'redux-logger'
import RootReducer from './RootReducer';

// const customMiddleWare = (store: any) => (next: (arg0: any) => void) => (action: { payload: { statusCode: number; }; type: string; }) => {
//     if (action.payload) {
//         if ((action.payload.statusCode == 401 || action.payload.statusCode == 403) && action.type !== 'auth/local/fulfilled' && action.type !== 'auth/local/rejected') {
//             // CommonHelper.logout();
//         }
//     }
//     next(action);
// }

const configureStore = (initialState: object) => {
    const enhance = compose(applyMiddleware(thunk.thunk, logger))
    return createStore(RootReducer, initialState, enhance);
}

const store = configureStore({});

export default store;

// Infer the RootState and AppDispatch types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch