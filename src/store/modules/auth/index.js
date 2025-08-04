import mutations from './mutations';
import actions from './actions';
import getters from './getters';

export default {
    namespaced: true,
    state() {
        return {
            token: '',
            email: '',
            name: '',
            phone: '',
            userId: '',
            role: '',
            refreshToken: '',
            expiresIn: 'sdsds',
            autoLogout: false
        };
    },
    mutations,
    getters,
    actions
};
