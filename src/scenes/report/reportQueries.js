import { http } from "../../utils/http";

const getTotalRevenue = async (startDate, endDate, timeOption) => {
    const resp = await http.get(`/reports/${startDate}/${endDate}/${timeOption}`)
    return resp.data
}

const getTotalWeekRevenue = async (date) => {
    const resp = await http.get(`/reports/${date}`)
    return resp.data
}

export { getTotalRevenue, getTotalWeekRevenue }