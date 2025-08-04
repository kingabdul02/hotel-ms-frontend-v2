import { createStore } from 'vuex';

export default createStore({
    state: {
        isModalVisible: false
    },
    mutations: {
        showModal(state) {
            state.isModalVisible = true;
        },
        hideModal(state) {
            state.isModalVisible = false;
        }
    }
});
