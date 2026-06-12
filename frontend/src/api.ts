import axios from "axios";

const api = axios.create({
    baseURL: "https://farenga-scheduler.onrender.com/"
})

export default api