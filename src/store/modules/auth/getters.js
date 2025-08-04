import { GET_USER_TOKEN_GETTER, IS_USER_AUTHENTICATE_GETTER, GET_USER_DATA_GETTER } from '../../storeconstants';

export default {
    [GET_USER_TOKEN_GETTER]: (state) => {
        return state.token;
    },

    [IS_USER_AUTHENTICATE_GETTER](state) {
        return !!state.token;
    },

    [GET_USER_DATA_GETTER]: (state) => {
        return {
            email: state.email,
            name: state.name,
            phone: state.phone,
            userId: state.userId,
            token: state.token,
            expiresIn: state.expiresIn,
            refreshToken: state.refreshToken,
            role: state.role
        };
    }
};
