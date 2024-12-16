// services/api.js
import axiosClient from '../axiosClient';

export const fetchUsers = async (event, theme, category) => {
    try {
        const response = await axiosClient.get('/performers', {
            params: {
                event,
                theme,
                category,
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
};
