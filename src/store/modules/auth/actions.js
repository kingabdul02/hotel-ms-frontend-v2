import axiosInstance from '@/service/AxiosInstance';
import { AUTH_ACTION, GUEST_AUTH_ACTION, LOGIN_ACTION, LOGIN_ACTION_GUEST, AUTO_LOGIN_ACTION, LOGOUT_ACTION, SET_USER_TOKEN_DATA_MUTATION, SIGNUP_ACTION, GUEST_AUTH_ACTION_REG } from '../../storeconstants';

let logoutTimer;

export default {
    [LOGOUT_ACTION](context) {
        context.commit(SET_USER_TOKEN_DATA_MUTATION, {
            email: null,
            name: null,
            phone: null,
            token: null,
            expiresIn: null,
            refreshToken: null,
            userId: null
        });
        localStorage.removeItem('userData');
        if (logoutTimer) {
            clearTimeout(logoutTimer);
        }
    },

    async [LOGIN_ACTION](context, payload) {
        return context.dispatch(AUTH_ACTION, {
            ...payload,
            url: `/auth/login`
        });
    },

    async [LOGIN_ACTION_GUEST](context, payload) {
        return context.dispatch(GUEST_AUTH_ACTION, {
            ...payload,
            url: `/auth/login`
        });
    },

    async [SIGNUP_ACTION](context, payload) {
        return context.dispatch(GUEST_AUTH_ACTION_REG, {
            ...payload,
            url: `/auth/register`
        });
    },

    [AUTO_LOGIN_ACTION](context) {
        let userData = localStorage.getItem('userData');
        if (userData) {
            const parsedData = JSON.parse(userData);
            context.commit(SET_USER_TOKEN_DATA_MUTATION, parsedData);

            const expiresIn = parsedData.expiresIn - new Date().getTime();
            if (expiresIn <= 0) {
                context.dispatch(LOGOUT_ACTION);
            } else {
                logoutTimer = setTimeout(() => {
                    context.dispatch(LOGOUT_ACTION);
                }, expiresIn);
            }
        }
    },

    async [AUTH_ACTION](context, payload) {
        let postData = {
            email: payload.email,
            password: payload.password,
            returnSecureToken: true
        };
        let response = '';
        try {
            response = await axiosInstance.post(payload.url, postData);
        } catch (err) {
            let errorMessage = err.response.data.message || 'An error occurred during login';
            throw new Error(errorMessage);
        }

        if (response.status === 200) {
            const userData = response.data.data.user;
            const userRole = userData.role;

            if (userRole === 'Guest') {
                throw new Error('You do not have the required permissions.');
            }

            let tokenData = {
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                token: response.data.data.access_token,
                expiresIn: new Date().getTime() + 30 * 60 * 100000,
                refreshToken: response.data.refreshToken,
                userId: userData.id,
                role: userData.role
            };

            localStorage.setItem('userData', JSON.stringify(tokenData));
            context.commit(SET_USER_TOKEN_DATA_MUTATION, tokenData);

            // Set auto logout timer
            logoutTimer = setTimeout(() => {
                context.dispatch(LOGOUT_ACTION);
            }, 30 * 60 * 10000); // 30 minutes
        }
    },

    async [GUEST_AUTH_ACTION](context, payload) {
        let postData = {
            email: payload.email,
            password: payload.password,
            returnSecureToken: true
        };
        let response = '';
        try {
            response = await axiosInstance.post(payload.url, postData);
        } catch (err) {
            let errorMessage = err.response.data.message || 'An error occurred during login';
            throw new Error(errorMessage);
        }

        if (response.status === 200) {
            const userData = response.data.data.user;
            const userRole = userData.role;

            if (userRole !== 'Guest') {
                throw new Error('Access denied: Only guests are allowed.');
            }

            let tokenData = {
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                token: response.data.data.access_token,
                expiresIn: new Date().getTime() + 30 * 60 * 100000,
                refreshToken: response.data.refreshToken,
                userId: userData.id,
                role: userData.role
            };
            localStorage.setItem('userData', JSON.stringify(tokenData));
            context.commit(SET_USER_TOKEN_DATA_MUTATION, tokenData);

            // Set auto logout timer
            logoutTimer = setTimeout(() => {
                context.dispatch(LOGOUT_ACTION);
            }, 30 * 60 * 10000); // 30 minutes
        }
    },

    async [GUEST_AUTH_ACTION_REG](context, payload) {
        let postData = {
            email: payload.email,
            password: payload.password,
            password_confirmation: payload.password_confirmation,
            name: payload.name,
            phone: payload.phone,
            role: 'Guest',
            address: '',
            returnSecureToken: true
        };
        let response = '';
        try {
            response = await axiosInstance.post(payload.url, postData);
        } catch (err) {
            let errorMessage = err.response.data.message || 'An error occurred during signup';
            throw new Error(errorMessage);
        }

        if (response.status === 200) {
            const userData = response.data.data.user;

            let tokenData = {
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                token: response.data.data.access_token,
                expiresIn: new Date().getTime() + 30 * 60 * 100000,
                refreshToken: response.data.refreshToken,
                userId: userData.id,
                role: userData.role
            };
            localStorage.setItem('userData', JSON.stringify(tokenData));
            context.commit(SET_USER_TOKEN_DATA_MUTATION, tokenData);
        }
    }
};
