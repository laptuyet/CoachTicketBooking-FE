import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import DoNotDisturbAltOutlinedIcon from "@mui/icons-material/DoNotDisturbAltOutlined";
import SaveAsOutlinedIcon from "@mui/icons-material/SaveAsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SquareIcon from "@mui/icons-material/Square";
import { LoadingButton } from "@mui/lab";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Input,
  InputAdornment,
  Modal,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { Formik } from "formik";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../../../components/Header";
import { tokens } from "../../../theme";
import * as bookingApi from "../../ticket/ticketQueries";
import * as tripApi from "../../trip/tripQueries";
import Bed_Limousine_Seat_Data from "../booking/SeatModels/Bed_Limousine_Seat_Data";
import SeatModel from "./SeatModels/SeatModel";
import { handleToast } from "../../../utils/helpers";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

const getBookingPriceString = (trip) => {
  let finalPrice = trip.price;
  if (!isNaN(trip?.discount?.amount)) {
    finalPrice -= trip.discount.amount;
  }
  // nhớ format cho đẹp
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(finalPrice);
};

const getBookingPrice = (trip) => {
  let finalPrice = trip.price;
  if (!isNaN(trip?.discount?.amount)) {
    finalPrice -= trip.discount.amount;
  }
  return finalPrice;
};

const getPriceChangeNote = (newTrip, oldTrip) => {
  const newPrice = getBookingPrice(newTrip);
  const oldPrice = getBookingPrice(oldTrip);

  let msg = `Old trip price(${formatCurrency(
    oldPrice
  )}) => New trip price(${formatCurrency(newPrice)}), changed: `;

  if (newPrice > oldPrice) {
    msg += `+${formatCurrency(newPrice - oldPrice)}`;
  } else {
    msg += `-${formatCurrency(oldPrice - newPrice)}`;
  }
  return msg;
};

const tripFindModel = {
  sourceId: -1,
  destId: -1,
  fromDate: format(new Date(), "yyyy-MM-dd"),
  toDate: format(new Date(), "yyyy-MM-dd"),
};

const MAX_SEAT_SELECT = 1;

const BookingForm = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const { bookingId } = useParams();
  const queryClient = useQueryClient();

  const [openChangeDptTime, setOpenChangeDptTime] = useState(false);
  const [openChangeSeat, setOpenChangeSeat] = useState(false);
  const [findTripObject, setFindTripObject] = useState(tripFindModel);
  const [findTripClicked, setFindTripClicked] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [numberOrderedSeats, setNumberOrderedSeats] = useState({});
  const [tripList, setTripList] = useState([]);
  const [seatData, setSeatData] = useState(Bed_Limousine_Seat_Data);
  const [numberOfSelectedSeats, setNumberOfSelectedSeats] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState(-1);
  const [isBookingChanged, setIsBookingChanged] = useState(false);
  const [myOrderedSeats, setMyOrderedSeats] = useState([]);
  const [currentPaymentStatus, setCurrentPaymentStatus] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);

  const bookingQuery = useQuery({
    queryKey: ["bookings", bookingId],
    queryFn: () => bookingApi.getBooking(bookingId),
  });

  const findTripQuery = useQuery({
    queryKey: [
      "trips",
      findTripObject.sourceId,
      findTripObject.destId,
      findTripObject.fromDate,
      findTripObject.toDate,
    ],
    queryFn: () =>
      tripApi.findAllTripBySourceAndDest(
        findTripObject.sourceId,
        findTripObject.destId,
        findTripObject.fromDate,
        findTripObject.toDate
      ),
    enabled:
      findTripClicked &&
      findTripObject.sourceId > -1 &&
      findTripObject.destId > -1,
  });

  const seatBookingQuery = useQuery({
    queryKey: ["bookings/empty", selectedTripId],
    queryFn: () => bookingApi.getSeatBooking(selectedTripId),
    enabled: openChangeSeat && selectedTripId > -1,
    keepPreviousData: true,
  });

  const handleSeatChoose = useCallback(
    (seatNumber, STAIR, isSelected, isOrdered, setFieldValue) => {
      // if chosen seat is not gonna or is ordered then do nothing
      if (isOrdered) return;

      // max seat select
      if (isSelected && numberOfSelectedSeats === MAX_SEAT_SELECT) return;

      let newSelectedSeats = [...selectedSeats];

      if (isSelected) {
        newSelectedSeats.push(seatNumber);
        setSelectedSeats(newSelectedSeats);
        setNumberOfSelectedSeats(1);
        setFieldValue("seatNumber", seatNumber);
      } else {
        newSelectedSeats = newSelectedSeats.filter(
          (seat) => seat !== seatNumber
        );
        setSelectedSeats(newSelectedSeats);
        setNumberOfSelectedSeats(0);
        setFieldValue("seatNumber", "");
      }

      // mapping and update state
      const newValues = {
        ...seatData,
        [STAIR]: {
          ...seatData[STAIR],
          [seatNumber]: {
            ...seatData[STAIR][seatNumber],
            choose: isSelected,
          },
        },
      };
      setSeatData(newValues);

      // setFieldValue("totalPayment", newSelectedSeats.length * price);
    },
    [seatData, selectedSeats]
  );

  const memoizedHandleSeatChoose = useMemo(
    () => handleSeatChoose,
    [handleSeatChoose]
  );

  const updateMutation = useMutation({
    mutationFn: (updatedBooking) => bookingApi.updateBooking(updatedBooking),
  });

  const handleFormSubmit = (values, actions) => {
    if (values.seatNumber === "") {
      handleToast("error", "Must choose one seat");
      return;
    }

    if (
      bookingQuery?.data?.seatNumber !== values.seatNumber ||
      bookingQuery?.data?.trip.id !== values.trip.id
    ) {
      values.bookingStatus = "CHANGED";
      setIsBookingChanged(true);
    }

    if (values.bookingStatus === "CHANGED") {
      let priceNote = getPriceChangeNote(values.trip, bookingQuery?.data.trip);
      values.note = priceNote.concat(", " + values.note);
    }

    updateMutation.mutate(values, {
      onSuccess: (data) => {
        setSelectedItemIndex(-1); // unchoose trip
        setTripList([]); // clear old trip data
        setFindTripClicked(false);
        queryClient.setQueryData(["bookings", bookingId], data);
        handleToast("success", "Update Booking successfully");
      },
      onError: (error) => {
        console.log(error);
        handleToast("error", error.response?.data?.message);
      },
    });
  };

  const getNumberOfOrderedSeats = async (tripId) => {
    const resp = await bookingApi.getSeatBooking(tripId);
    return resp;
  };

  const getLatestPaymentStatus = (bookingStatusHistories) => {
    if (bookingStatusHistories !== null) {
      const len = bookingStatusHistories?.length;
      if (len !== null && len > 0) {
        for (let i = len - 1; i >= 0; i--) {
          let latestHis = bookingStatusHistories[i];
          if (latestHis?.newStatus === "CHANGED") {
            return latestHis.oldStatus;
          } else return latestHis.newStatus;
        }
      }
    }
  };

  const isBookingEverChanged = (bookingStatusHistories) => {
    if (bookingStatusHistories !== null) {
      let len = bookingStatusHistories?.length;
      if (len !== null && len > 0) {
        for (let i = 0; i < len; i++) {
          if (
            bookingStatusHistories[i]?.newStatus === "CHANGED" ||
            bookingStatusHistories[i]?.oldStatus === "CHANGED"
          ) {
            return true;
          }
        }
        return false;
      }
    }
  };

  // to set selected trip id and selected seat base on current booking
  // set current payment status
  useEffect(() => {
    if (bookingQuery?.data) {
      let paymentHis = getLatestPaymentStatus(
        bookingQuery?.data?.bookingStatusHistories
      );
      setCurrentPaymentStatus(paymentHis);
      setSelectedTripId(bookingQuery?.data?.trip.id);
      setIsBookingChanged(
        isBookingEverChanged(bookingQuery?.data?.bookingStatusHistories)
      );
    }
  }, [bookingQuery?.data]);

  // set new selectedSeats and orderedSeats when change trip
  useEffect(() => {
    const isSameTrip = selectedTripId === bookingQuery?.data?.trip.id;
    const currentSeat = bookingQuery?.data?.seatNumber;

    if (isSameTrip && seatBookingQuery?.data) {
      let ordSeats = seatBookingQuery?.data;
      ordSeats = ordSeats.map((item) => item.seatNumber);
      ordSeats = ordSeats.filter((seat) => seat !== currentSeat);
      setSelectedSeats([currentSeat]);
      setMyOrderedSeats(ordSeats);
      setNumberOfSelectedSeats(1);
    } else if (!isSameTrip && seatBookingQuery?.data) {
      let ordSeats = seatBookingQuery?.data;
      ordSeats = ordSeats.map((item) => item.seatNumber);
      setSelectedSeats([]);
      setMyOrderedSeats(ordSeats);
      setNumberOfSelectedSeats(0);
    }
  }, [selectedTripId, seatBookingQuery?.data]);

  // perform set trip list & calculate number of ordered seats
  useEffect(() => {
    const fetchOrderedSeats = async () => {
      if (findTripQuery.data) {
        let tempTrips = findTripQuery.data;

        const promises = tempTrips.map((trip) =>
          getNumberOfOrderedSeats(trip.id)
        );

        const orderedSeatsList = await Promise.all(promises);

        // [{tripId: OrderedArray[]}, ..s.]
        const mappedOrderedSeatsList = {};
        tempTrips.forEach(
          (trip, index) =>
            (mappedOrderedSeatsList[trip.id] = orderedSeatsList[index])
        );

        setNumberOrderedSeats(mappedOrderedSeatsList);
        setTripList(tempTrips);
      }
    };

    fetchOrderedSeats(); // Gọi hàm fetchOrderedSeats khi component được render
  }, [findTripQuery.data]);

  return (
    <Box m="20px">
      <Header title={"EDIT BOOKING"} subTitle={"Edit booking profile"} />
      {!bookingQuery.isSuccess ? undefined : (
        <Formik
          onSubmit={handleFormSubmit}
          initialValues={bookingQuery.data}
          enableReinitialize={true}
        >
          {({
            values,
            errors,
            touched,
            setFieldValue,
            handleChange,
            handleBlur,
            handleSubmit,
          }) => (
            <form onSubmit={handleSubmit}>
              <Box
                display="grid"
                gridTemplateColumns="repeat(6, minmax(0, 1fr))"
                gap="10px"
                p="0 40px"
              >
                {/* booking summary */}
                <Box
                  gridColumn="span 3"
                  display="flex"
                  flexDirection="column"
                  gap="10px"
                >
                  <Typography variant="h3" fontWeight="bold" mb="16px">
                    Summary Booking Info
                  </Typography>
                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Code: </span>
                    {`${values.code}`}
                  </Typography>
                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Customer: </span>
                    {`${values.custFirstName} ${values.custLastName}`}
                  </Typography>
                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Contact Phone: </span>
                    {`${values.phone}`}
                  </Typography>
                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Pickup Address: </span>
                    {`${values.pickUpAddress}`}
                  </Typography>
                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Route: </span>
                    {`${values.trip.source.name} ${`\u21D2`} ${
                      values.trip.destination.name
                    }`}
                  </Typography>
                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Coach: </span>
                    {`${values.trip.coach.name}, Type: ${values.trip.coach.coachType}`}
                  </Typography>

                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Total: </span>
                    {`${formatCurrency(getBookingPrice(values.trip))}`}
                  </Typography>

                  <Typography component="span" variant="h5">
                    <span style={{ fontWeight: "bold" }}>Method: </span>
                    {values.paymentMethod}
                  </Typography>
                </Box>

                {/* Change departure datetime & seat number */}
                <Box
                  gridColumn="span 3"
                  display="flex"
                  flexDirection="column"
                  gap="10px"
                  justifyContent="center"
                >
                  {/* Change departureDateTime */}
                  <Box display="flex" alignItems="center" gap="10px">
                    <Typography component="span" variant="h5">
                      <span style={{ fontWeight: "bold" }}>
                        Departure Date Time:{" "}
                      </span>{" "}
                      {format(
                        parse(
                          values.trip.departureDateTime,
                          "yyyy-MM-dd HH:mm",
                          new Date()
                        ),
                        "HH:mm dd-MM-yyyy"
                      )}
                    </Typography>
                    <Button
                      disabled={isBookingChanged}
                      variant="outlined"
                      onClick={() => setOpenChangeDptTime(!openChangeDptTime)}
                    >
                      Change
                    </Button>
                  </Box>

                  {/* Change Seat */}
                  <Box display="flex" alignItems="center" gap="10px">
                    <Typography component="span" variant="h5">
                      <span style={{ fontWeight: "bold" }}>Seat: </span>
                      {values.seatNumber}
                    </Typography>
                    <Button
                      disabled={isBookingChanged}
                      variant="outlined"
                      onClick={() => setOpenChangeSeat(!openChangeSeat)}
                    >
                      Change
                    </Button>
                  </Box>

                  {/* Payment status */}
                  <Box>
                    {values.bookingStatus !== "CANCEL" && (
                      <FormControl
                        sx={{
                          gridColumn: "span 2",
                        }}
                      >
                        <FormLabel color="warning" id="bookingStatus">
                          Payment Status
                        </FormLabel>
                        <RadioGroup
                          row
                          aria-labelledby="bookingStatus"
                          name="row-radio-buttons-group"
                          value={currentPaymentStatus}
                          onChange={(e) => {
                            setFieldValue("bookingStatus", e.target.value);
                            setCurrentPaymentStatus(e.target.value);
                          }}
                        >
                          <FormControlLabel
                            value="UNPAID"
                            control={
                              <Radio
                                sx={{
                                  color: "#00a0bd",
                                  "&.Mui-checked": {
                                    color: "#00a0bd",
                                  },
                                }}
                              />
                            }
                            label="UNPAID"
                          />
                          <FormControlLabel
                            value="PAID"
                            control={
                              <Radio
                                sx={{
                                  color: "#00a0bd",
                                  "&.Mui-checked": {
                                    color: "#00a0bd",
                                  },
                                }}
                              />
                            }
                            label="PAID"
                          />
                          {/* <FormControlLabel
                            value="CHANGED"
                            control={
                              <Radio
                                sx={{
                                  color: "#00a0bd",
                                  "&.Mui-checked": {
                                    color: "#00a0bd",
                                  },
                                }}
                              />
                            }
                            label="CHANGED"
                          /> */}
                        </RadioGroup>
                      </FormControl>
                    )}
                  </Box>

                  <TextField
                    label="Note"
                    defaultValue={values?.note ?? ""}
                    value={values.note}
                    onChange={(e) => {
                      setFieldValue("note", e.target.value);
                    }}
                  />
                </Box>

                {/* Modal change dpt datetime (change trip) */}
                <Modal
                  sx={{
                    "& .MuiBox-root": {
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? colors.primary[400]
                          : "#fff",
                    },
                  }}
                  open={openChangeDptTime}
                  onClose={() => setOpenChangeDptTime(!openChangeDptTime)}
                  aria-labelledby="modal-changeDptTime-title"
                  aria-describedby="modal-changeDptTime-description"
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      minWidth: 400,
                      borderRadius: "10px",
                      boxShadow: 24,
                      p: 4,
                    }}
                  >
                    {/* choose time */}
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      gap="10px"
                      sx={{
                        gridColumn: "span 6",
                      }}
                    >
                      {/* from date */}
                      <FormControl fullWidth>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            format="dd/MM/yyyy"
                            label="From"
                            minDate={new Date()}
                            value={parse(
                              findTripObject.fromDate,
                              "yyyy-MM-dd",
                              new Date()
                            )}
                            onChange={(newDate) => {
                              // setFieldValue(
                              //   "from",
                              //   format(newDate, "yyyy-MM-dd")
                              // );
                              setFindTripObject({
                                ...findTripObject,
                                fromDate: format(newDate, "yyyy-MM-dd"),
                              });
                            }}
                            slotProps={{
                              textField: {
                                InputProps: {
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <CalendarMonthIcon />
                                    </InputAdornment>
                                  ),
                                },
                                size: "small",
                                color: "warning",
                                error: !!touched.from && !!errors.from,
                              },
                              dialog: {
                                sx: {
                                  "& .MuiButton-root": {
                                    color: colors.grey[100],
                                  },
                                },
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </FormControl>

                      {/* to date */}
                      <FormControl fullWidth>
                        <LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DatePicker
                            format="dd/MM/yyyy"
                            label="To"
                            minDate={parse(
                              findTripObject.fromDate,
                              "yyyy-MM-dd",
                              new Date()
                            )}
                            value={parse(
                              findTripObject.toDate,
                              "yyyy-MM-dd",
                              new Date()
                            )}
                            onChange={(newDate) => {
                              // setFieldValue(
                              //   "to",
                              //   format(newDate, "yyyy-MM-dd")
                              // );
                              setFindTripObject({
                                ...findTripObject,
                                toDate: format(newDate, "yyyy-MM-dd"),
                              });
                            }}
                            slotProps={{
                              textField: {
                                InputProps: {
                                  endAdornment: (
                                    <InputAdornment position="end">
                                      <CalendarMonthIcon />
                                    </InputAdornment>
                                  ),
                                },
                                size: "small",
                                color: "warning",
                                error: !!touched.to && !!errors.to,
                              },
                              dialog: {
                                sx: {
                                  "& .MuiButton-root": {
                                    color: colors.grey[100],
                                  },
                                },
                              },
                            }}
                          />
                        </LocalizationProvider>
                      </FormControl>

                      {/* Find trip button */}
                      <LoadingButton
                        disableRipple
                        disableTouchRipple
                        disableElevation
                        disableFocusRipple
                        onClick={() => {
                          setFindTripClicked(true);
                          setFindTripObject({
                            ...findTripObject,
                            sourceId: values.trip.source.id,
                            destId: values.trip.destination.id,
                          });
                        }}
                        color="info"
                        variant="contained"
                        loadingPosition="start"
                        loading={
                          findTripQuery.isLoading &&
                          findTripClicked &&
                          !!values.trip.source &&
                          !!values.trip.destination
                        }
                        startIcon={<SearchIcon />}
                      >
                        Find
                      </LoadingButton>
                    </Box>

                    {findTripQuery.isLoading &&
                    findTripClicked &&
                    !!values.trip.source &&
                    !!values.trip.destination ? (
                      <Box textAlign="center">
                        <CircularProgress color="info" />
                      </Box>
                    ) : tripList.length !== 0 ? (
                      <Box
                        display="grid"
                        gridTemplateColumns="repeat(2, 1fr)"
                        gap="20px"
                        p="0 20px"
                        mt="20px"
                        sx={{
                          width: "100%",
                          position: "relative",
                          overflow: "auto",
                          maxHeight: 350,
                        }}
                      >
                        {tripList.map((trip, index) => {
                          return (
                            //  trip card
                            <Card
                              elevation={0}
                              onClick={() => {
                                setFieldValue("trip", trip);
                                setSelectedTripId(trip.id);
                                setSelectedItemIndex(index);
                                setSelectedTrip(trip);
                              }}
                              key={index}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                padding: "0 20px",
                                borderRadius: "10px",
                                gridColumn: "span 2",
                                cursor: "pointer",
                              }}
                            >
                              <Box display="flex" flexDirection="column">
                                <CardContent sx={{ flex: "1 0 auto" }}>
                                  <Typography variant="h5" fontStyle="italic">
                                    Departure Date Time
                                  </Typography>
                                  <Typography
                                    variant="h4"
                                    mt="5px"
                                    fontWeight="bold"
                                  >
                                    {format(
                                      parse(
                                        trip.departureDateTime,
                                        "yyyy-MM-dd HH:mm",
                                        new Date()
                                      ),
                                      "HH:mm dd-MM-yyyy"
                                    )}
                                  </Typography>
                                  <Typography mt="5px" variant="h6">
                                    Duration:{" "}
                                    {trip.duration
                                      ? trip.duration + " hour(s)"
                                      : "Not defined yet"}
                                  </Typography>
                                  <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap="6px"
                                    mt="15px"
                                    p="6px 0"
                                    borderRadius="30px"
                                    bgcolor={colors.grey[300]}
                                  >
                                    <Typography variant="h5">
                                      {getBookingPriceString(trip)}
                                    </Typography>
                                    <Typography
                                      variant="h5"
                                      color={colors.grey[600]}
                                    >{`\u25CF`}</Typography>
                                    <Typography variant="h5">
                                      {trip.coach.coachType}
                                    </Typography>
                                    <Typography
                                      variant="h5"
                                      color={colors.grey[600]}
                                    >{`\u25CF`}</Typography>
                                    <Typography variant="h5">
                                      Seats:{" "}
                                      {trip.coach.capacity -
                                        numberOrderedSeats[trip.id]
                                          ?.length}{" "}
                                      left
                                    </Typography>
                                  </Box>
                                </CardContent>
                              </Box>

                              <Box
                                display="flex"
                                justifyContent="center"
                                alignItems="center"
                                flexDirection="column"
                              >
                                {index === selectedItemIndex ||
                                values.trip === trip ||
                                trip.id === selectedTripId ? (
                                  <CheckCircleOutlineOutlinedIcon
                                    sx={{ width: "30px", height: "30px" }}
                                    color="success"
                                  />
                                ) : (
                                  <CircleOutlinedIcon
                                    sx={{ width: "30px", height: "30px" }}
                                  />
                                )}
                                <Typography>Choose</Typography>
                              </Box>
                            </Card>
                          );
                        })}
                      </Box>
                    ) : (
                      // empty list icon
                      <Box
                        height="100%"
                        display="flex"
                        flexDirection="column"
                        justifyContent="center"
                        alignItems="center"
                        mt="20px"
                        sx={{
                          color: colors.grey[700],
                        }}
                      >
                        <DoNotDisturbAltOutlinedIcon
                          sx={{
                            width: "100px",
                            height: "100px",
                          }}
                        />
                        <Typography variant="h4">Not found any trip</Typography>
                      </Box>
                    )}
                  </Box>
                </Modal>

                {/* Modal change seat */}
                <Modal
                  sx={{
                    "& .MuiBox-root": {
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? colors.primary[400]
                          : "#fff",
                    },
                  }}
                  open={openChangeSeat}
                  onClose={() => setOpenChangeSeat(!openChangeSeat)}
                  aria-labelledby="modal-changeSeat-title"
                  aria-describedby="modal-changeSeat-description"
                >
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      minWidth: 400,
                      borderRadius: "10px",
                      boxShadow: 24,
                      p: 4,
                    }}
                  >
                    {/* Render additional information */}
                    <Box
                      gap="35px"
                      display="flex"
                      justifyContent="center"
                      mb="20px"
                      // flexDirection="column"
                    >
                      <Typography variant="h5">
                        <span style={{ fontWeight: "bold" }}>
                          Selected: {numberOfSelectedSeats} / {MAX_SEAT_SELECT}{" "}
                          seats
                        </span>
                      </Typography>
                      <Typography variant="h5">
                        <span style={{ fontWeight: "bold" }}>
                          Total:{" "}
                          {formatCurrency(
                            getBookingPrice(values.trip) * numberOfSelectedSeats
                          )}
                        </span>
                      </Typography>
                    </Box>

                    {/* Render seats */}
                    <Box
                      gridColumn="span 6"
                      display="flex"
                      alignItems="center"
                      justifyContent="space-evenly"
                      gap="50px"
                    >
                      {Object.keys(seatData).map((stair, index) => (
                        <Box
                          key={index}
                          display="grid"
                          // gap="4px"
                          gridTemplateColumns="repeat(3, minmax(0, 1fr))"
                        >
                          {Object.entries(seatData[stair]).map((values) => {
                            return (
                              <SeatModel
                                key={values[0]}
                                handleSeatChoose={memoizedHandleSeatChoose}
                                seat={values[1]}
                                selectedSeats={selectedSeats}
                                orderedSeats={myOrderedSeats}
                                coachType={
                                  bookingQuery?.data?.trip.coach.coachType
                                }
                                setFieldValue={setFieldValue}
                              />
                            );
                          })}
                        </Box>
                      ))}
                    </Box>

                    {/* render seat tip */}
                    <Box
                      gridColumn="span 3"
                      mt="30px"
                      gap="35px"
                      display="flex"
                      justifyContent="center"
                    >
                      <Box textAlign="center">
                        <SquareIcon
                          sx={{
                            borderRadius: "20px",
                            width: "25px",
                            height: "25px",
                            color: "#000",
                          }}
                        />
                        <Typography fontWeight="bold">Ordered</Typography>
                      </Box>
                      <Box textAlign="center">
                        <SquareIcon
                          sx={{
                            borderRadius: "20px",
                            width: "25px",
                            height: "25px",
                            color: "#979797",
                          }}
                        />
                        <Typography fontWeight="bold">Empty</Typography>
                      </Box>
                      <Box textAlign="center">
                        <SquareIcon
                          sx={{
                            borderRadius: "20px",
                            width: "25px",
                            height: "25px",
                            color: "#ff4138",
                          }}
                        />
                        <Typography fontWeight="bold">Choosing</Typography>
                      </Box>
                    </Box>
                  </Box>
                </Modal>
              </Box>

              <Box mt="20px" display="flex" justifyContent="center">
                <LoadingButton
                  disabled={values.bookingStatus === "CANCEL"}
                  color="secondary"
                  type="submit"
                  variant="contained"
                  loadingPosition="start"
                  loading={updateMutation.isLoading}
                  startIcon={<SaveAsOutlinedIcon />}
                >
                  "SAVE"
                </LoadingButton>
              </Box>
            </form>
          )}
        </Formik>
      )}
    </Box>
  );
};

export default BookingForm;
