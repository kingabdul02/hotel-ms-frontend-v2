import {
    SET_AUTO_LOGOUT_MUTATION,
    SET_USER_TOKEN_DATA_MUTATION,
} from '../../storeconstants';

export default {
    [SET_USER_TOKEN_DATA_MUTATION](state, payload) {
        state.email = payload.email;
        state.phone = payload.phone;
        state.name = payload.name;
        state.token = payload.token;
        state.expiresIn = payload.expiresIn;
        state.refreshToken = payload.refreshToken;
        state.userId = payload.userId;
        state.role = payload.role;
        state.autoLogout = false;
    },

    [SET_AUTO_LOGOUT_MUTATION](state) {
        state.autoLogout = true;
    },
};
