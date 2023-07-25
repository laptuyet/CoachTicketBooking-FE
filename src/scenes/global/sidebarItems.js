import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import RouteOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import TripOutlinedIcon from "@mui/icons-material/AltRouteOutlined";
import TicketOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import BusOutlinedIcon from "@mui/icons-material/AirportShuttleOutlined";
import PaymentOutlinedIcon from "@mui/icons-material/PaidOutlined";
import DiscountOutlinedIcon from "@mui/icons-material/DiscountOutlined";
import ReportOutlinedIcon from "@mui/icons-material/TimelineOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";

export const sidebarItems = [
    {
        title: 'Dashboard',
        to: '/',
        icon: HomeOutlinedIcon
    },
    {
        title: 'Driver',
        to: '/drivers',
        icon: RouteOutlinedIcon
    },
    {
        title: 'Trip',
        to: '/trips',
        icon: TripOutlinedIcon
    },
    {
        title: 'Ticket',
        to: '/tickets',
        icon: TicketOutlinedIcon
    },
    {
        title: 'Coach',
        to: '/coaches',
        icon: BusOutlinedIcon
    },
    {
        title: 'Payment',
        to: '/payments',
        icon: PaymentOutlinedIcon
    },
    {
        title: 'Discount',
        to: '/discounts',
        icon: DiscountOutlinedIcon
    },
    {
        title: 'Report',
        to: '/reports',
        icon: ReportOutlinedIcon
    },
    {
        title: 'Users',
        to: '/users',
        icon: PeopleAltOutlinedIcon
    }
]