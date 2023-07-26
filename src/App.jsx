import { CssBaseline, ThemeProvider } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Bus from "./scenes/bus";
import DashBoard from "./scenes/dashboard";
import Discount from "./scenes/discount";
import Driver from "./scenes/driver";
import BookingForm from "./scenes/form/booking";
import StepperBooking from "./scenes/form/booking/StepperBooking";
import CoachForm from "./scenes/form/coach";
import DiscountForm from "./scenes/form/discount";
import DriverForm from "./scenes/form/driver";
import TripForm from "./scenes/form/trip";
import UserForm from "./scenes/form/user";
import Sidebar from "./scenes/global/Sidebar";
import Topbar from "./scenes/global/Topbar";
import Payment from "./scenes/payment";
import Report from "./scenes/report";
import Ticket from "./scenes/ticket";
import Trip from "./scenes/trip";
import User from "./scenes/user";
import { ColorModeContext, useMode } from "./theme";

const App = () => {
  const [theme, colorMode] = useMode();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  });
  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer position="bottom-right" />
        <QueryClientProvider client={queryClient}>
          <div className="app">
            <Sidebar />
            <main className="content">
              <Topbar />
              <Routes>
                <Route path="/">
                  <Route index element={<DashBoard />} />
                  <Route path="drivers">
                    <Route index element={<Driver />} />
                    <Route path=":driverId" element={<DriverForm />} />
                    <Route path="new" element={<DriverForm />} />
                  </Route>
                  <Route path="trips">
                    <Route index element={<Trip />} />
                    <Route path=":tripId" element={<TripForm />} />
                    <Route path="new" element={<TripForm />} />
                  </Route>
                  <Route path="tickets">
                    <Route index element={<Ticket />} />
                    <Route path=":bookingId" element={<BookingForm />} />
                    <Route path="new" element={<StepperBooking />} />
                  </Route>
                  <Route path="coaches">
                    <Route index element={<Bus />} />
                    <Route path=":coachId" element={<CoachForm />} />
                    <Route path="new" element={<CoachForm />} />
                  </Route>
                  {/* <Route path="payments" element={<Payment />} /> */}
                  <Route path="discounts">
                    <Route index element={<Discount />} />
                    <Route path=":discountId" element={<DiscountForm />} />
                    <Route path="new" element={<DiscountForm />} />
                  </Route>
                  <Route path="reports" element={<Report />} />
                  <Route path="users">
                    <Route index element={<User />} />
                    <Route path=":username" element={<UserForm />} />
                    <Route path="new" element={<UserForm />} />
                  </Route>
                </Route>
              </Routes>
            </main>
          </div>
          <ReactQueryDevtools initialIsOpen={false} position="bottom-left" />
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default App;
