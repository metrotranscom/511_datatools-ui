// @flow

import update from 'react-addons-update'
import {handleActions, type ActionType} from 'redux-actions'

import * as adminActions from '../actions/admin'

import type {AdminUsersState} from '../../types/reducers'

export const defaultState = {
  isFetching: false,
  data: null,
  userCount: 0,
  page: 0,
  perPage: 10,
  userQueryString: null
}

const reducers = {
 'REQUESTING_USERS' (
   state: AdminUsersState,
   action: ActionType<typeof adminActions.requestingUsers>
  ): AdminUsersState {
    return update(state, {isFetching: { $set: true }})
  },
  'RECEIVE_USERS' (
    state: AdminUsersState,
    action: ActionType<typeof adminActions.receiveUsers>
  ): AdminUsersState {
    const {totalUserCount, users} = action.payload
    return update(state, {
      isFetching: { $set: false },
      data: { $set: users },
      userCount: { $set: totalUserCount }
    })
  },
  'CREATED_USER' (
    state: AdminUsersState,
    action: ActionType<typeof adminActions.createdUser>
  ): AdminUsersState {
    if (state.data) {
      return update(state, {data: { $push: [action.payload] }})
    }
    return state
  },
  'SET_USER_PAGE' (
    state: AdminUsersState,
    action: ActionType<typeof adminActions.setUserPage>
  ): AdminUsersState {
    return update(state, {page: { $set: action.payload }})
  },
  'SET_USER_QUERY_STRING' (
    state: AdminUsersState,
    action: ActionType<typeof adminActions.setUserQueryString>
  ): AdminUsersState {
    return update(state, {userQueryString: { $set: action.payload }})
  }
}

export default handleActions(reducers, defaultState)
