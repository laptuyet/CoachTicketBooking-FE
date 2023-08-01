import { http } from "../../utils/http";

const login = async (authReq) => {
    const resp = await http.post("/auth/login", authReq)
    return resp.data
}

const register = async (registerReq) => {
    const resp = await http.post("/auth/register", registerReq)
    return resp.data
}

const logout = () => {
    http.post("/auth/logout")
}

const checkExistUsername = async (username) => {
    const resp = await http.get(`/auth/checkExistUsername/${username}`)
    return resp.data
}

const checkExistEmail = async (email) => {
    const resp = await http.get(`/auth/checkExistEmail/${email}`)
    return resp.data
}

const checkExistPhone = async (phone) => {
    const resp = await http.get(`/auth/checkExistPhone/${phone}`)
    return resp.data
}


export { login, register, logout, checkExistUsername, checkExistEmail, checkExistPhone }