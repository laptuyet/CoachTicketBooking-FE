import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import DoNotDisturbAltOutlinedIcon from "@mui/icons-material/DoNotDisturbAltOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import SaveAsOutlinedIcon from "@mui/icons-material/SaveAsOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { LoadingButton } from "@mui/lab";
import {
  Autocomplete,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Modal,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { Formik } from "formik";
import React, { useState } from "react";
import { useMatch, useParams } from "react-router-dom";
import * as yup from "yup";
import CustomToolTip from "../../../components/CustomToolTip";
import Header from "../../../components/Header";
import { tokens } from "../../../theme";
import * as provinceApi from "../../global/provinceQueries";
import * as bookingApi from "../../ticket/ticketQueries";
import * as tripApi from "../../trip/tripQueries";

const initialValues = {
  id: -1,
  user: null,
  trip: null,
  bookingDateTime: format(new Date(), "yyyy-MM-dd HH:mm"),
  seatNumber: "",
  bookingType: "ONEWAY",
  pickUpAddress: "",
  phone: "",
  totalPayment: 0,
  paymentDateTime: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
  paymentMethod: "CASH",
  paymentStatus: "",
  isEditMode: false, // remove this field when submit
};

const bookingSchema = yup.object().shape({
  id: yup.number().notRequired(),
  user: yup.object().required("Required"),
  trip: yup.object().required("Required"),
  bookingDateTime: yup.date().required("Required"),
  seatNumber: yup.string().required("Required"),
  bookingType: yup.string().notRequired(),
  pickUpAddress: yup.string().required("Required"),
  phone: yup.string().required("Required"),
  totalPayment: yup.number().notRequired(),
  paymentDateTime: yup.date().notRequired(),
  paymentMethod: yup.string().required("Required"),
  paymentStatus: yup.string().required("Required"),
  isEditMode: yup.boolean().default(true),
});

const BookingForm = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const addNewMatch = useMatch("/tickets/new");
  const isAddMode = !!addNewMatch;
  const isNonMobile = useMediaQuery("(min-width:600px)");
  const { bookingId } = useParams();
  const queryClient = useQueryClient();
  const [findClicked, setFindClicked] = useState(false);
  const [openRouteModal, setOpenRouteModal] = useState(false);
  const [provinceClicked, setProvinceClicked] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  // const [set]

  // prepare data (province, trip, ...) for autocomplete combobox
  const provinceQuery = useQuery({
    queryKey: ["provinces", "all"],
    queryFn: () => provinceApi.getAll(),
    enabled: provinceClicked,
  });
  const handleProvinceOpen = () => {
    if (!provinceQuery.data) {
      setProvinceClicked(true);
      queryClient.prefetchQuery({
        queryKey: ["provinces", "all"],
        // queryFn: () => provinceApi.getAll(),
      });
    }
  };

  // prepare find trip query
  const findTripQuery = useQuery({
    queryKey: ["trips", selectedSource?.id, selectedDestination?.id],
    queryFn: () =>
      tripApi.findAllTripBySourceAndDest(
        selectedSource?.id,
        selectedDestination?.id
      ),
    keepPreviousData: true,
    enabled: !!selectedSource && !!selectedDestination && findClicked,
  });

  // Load booking data when mode is EDIT
  const { data } = useQuery({
    queryKey: ["bookings", bookingId],
    queryFn: () => bookingApi.getBooking(bookingId),
    enabled: bookingId !== undefined && !isAddMode, // only query when coachId is available
  });

  const mutation = useMutation({
    mutationFn: (newBooking) => bookingApi.createNewBooking(newBooking),
  });

  const updateMutation = useMutation({
    mutationFn: (updatedBooking) => bookingApi.updateBooking(updatedBooking),
  });

  // HANDLE FORM SUBMIT
  const handleFormSubmit = (values, { resetForm }) => {
    let { isEditMode, ...newValues } = values;
    console.log("submit", newValues);
    // if (isAddMode) {
    //   mutation.mutate(newValues, {
    //     onSuccess: () => {
    //       resetForm();
    //       handleToast("success", "Add new coach successfully");
    //     },
    //     onError: (error) => {
    //       console.log(error);
    //       handleToast("error", error.response?.data?.message);
    //     },
    //   });
    // } else {
    //   updateMutation.mutate(newValues, {
    //     onSuccess: (data) => {
    //       queryClient.setQueryData(["coaches", coachId], data);
    //       handleToast("success", "Update coach successfully");
    //     },
    //     onError: (error) => {
    //       console.log(error);
    //       handleToast("error", error.response?.data?.message);
    //     },
    //   });
    // }
  };

  // HANDLE SWAP LOCATION
  const handleSwapLocation = () => {
    // setFindClicked(false);
    setSelectedSource(selectedDestination);
    setSelectedDestination(selectedSource);
  };

  const formatTripInfo = (trip) => {
    let infoText = `${trip.source.name} \u21D2 ${trip.destination.name}\t[${trip.departureTime}]`;
    return infoText;
  };

  return (
    <Box m="20px">
      <Header
        title={undefined}
        subTitle={isAddMode ? "Create booking profile" : "Edit booking profile"}
      />
      <Formik
        onSubmit={handleFormSubmit}
        initialValues={data ? { ...data, isEditMode: true } : initialValues}
        validationSchema={bookingSchema}
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
            {/* BOOKING TYPE */}
            <Box display="flex">
              <FormControl
                sx={{
                  marginLeft: "auto",
                }}
              >
                <RadioGroup
                  row
                  // aria-labelledby="bookingType"
                  name="row-radio-buttons-group"
                  value={values.bookingType}
                  onChange={(e) => {
                    setFieldValue("bookingType", e.currentTarget.value);
                  }}
                >
                  <FormControlLabel
                    value="ONEWAY"
                    label="One way"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#00a0bd",
                          "&.Mui-checked": {
                            color: "#00a0bd",
                          },
                        }}
                      />
                    }
                  />
                  <FormControlLabel
                    value="ROUNDTRIP"
                    label="Round trip"
                    control={
                      <Radio
                        size="small"
                        sx={{
                          color: "#00a0bd",
                          "&.Mui-checked": {
                            color: "#00a0bd",
                          },
                        }}
                      />
                    }
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* chosen trip textfield and choose datetime  */}
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
              sx={{
                "& > div": {
                  gridColumn: isNonMobile ? undefined : "span 4",
                },
              }}
            >
              {/*chosen trip textfield*/}
              <Box
                display="flex"
                sx={{
                  gridColumn: "span 2",
                }}
              >
                <TextField
                  color="warning"
                  size="small"
                  fullWidth
                  variant="outlined"
                  type="text"
                  label="Trip"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  value={
                    values?.trip ? formatTripInfo(values.trip) : "Not selected"
                  }
                  name="name"
                  error={!!touched.name && !!errors.name}
                  helperText={touched.name && errors.name}
                />
                <CustomToolTip title="Choose Trip" placement="top">
                  <IconButton
                    onClick={() => {
                      setOpenRouteModal(!openRouteModal);
                    }}
                  >
                    <LocationOnOutlinedIcon />
                  </IconButton>
                </CustomToolTip>
              </Box>

              {/* choose time */}
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  gridColumn: "span 2",
                }}
              >
                {/* departure time */}
                <FormControl
                  fullWidth
                  sx={{
                    gridColumn: "span 2",
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      format="dd/MM/yyyy"
                      label="Departure Date"
                      minDate={new Date()}
                      value={parse(
                        values.bookingDateTime,
                        "yyyy-MM-dd HH:mm",
                        new Date()
                      )}
                      onChange={(newDate) => {
                        setFieldValue(
                          "bookingDateTime",
                          format(newDate, "yyyy-MM-dd HH:mm")
                        );
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
                          error: !!touched.dob && !!errors.dob,
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
                {/* return time */}
                <FormControl
                  fullWidth
                  sx={{
                    gridColumn: "span 2",
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      disabled={values.bookingType === "ONEWAY"}
                      format="dd/MM/yyyy"
                      label="Return Date"
                      minDate={parse(
                        values.bookingDateTime,
                        "yyyy-MM-dd HH:mm",
                        new Date()
                      )}
                      value={parse(
                        values.bookingDateTime,
                        "yyyy-MM-dd HH:mm",
                        new Date()
                      )}
                      onChange={(newDate) => {
                        setFieldValue(
                          "bookingDateTime",
                          format(newDate, "yyyy-MM-dd HH:mm")
                        );
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
                          error: !!touched.dob && !!errors.dob,
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
              </Box>
            </Box>

            {/* Button save/ update */}
            <Box mt="20px" display="flex" justifyContent="center">
              <LoadingButton
                color="secondary"
                type="submit"
                variant="contained"
                loadingPosition="start"
                loading={mutation.isLoading || updateMutation.isLoading}
                startIcon={<SaveAsOutlinedIcon />}
              >
                {isAddMode ? "CREATE" : "SAVE"}
              </LoadingButton>
            </Box>

            {/* CHOOSE TRIP MODAL */}
            <Modal
              sx={{
                "& .MuiBox-root": {
                  bgcolor:
                    theme.palette.mode === "dark"
                      ? colors.primary[400]
                      : "#fff",
                },
              }}
              open={openRouteModal}
              onClose={() => setOpenRouteModal(!openRouteModal)}
              aria-labelledby="modal-routeModal-title"
              aria-describedby="modal-routeModal-description"
            >
              <Box
                sx={{
                  position: "absolute",
                  top: "40%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "50%",
                  borderRadius: "10px",
                  boxShadow: 24,
                  p: 4,
                }}
              >
                <Box textAlign="center" marginBottom="30px">
                  <Typography variant="h4">CHOOSE TRIP</Typography>
                </Box>
                <Box textAlign="center" mb="30px">
                  <LoadingButton
                    onClick={() => setFindClicked(true)}
                    color="info"
                    variant="contained"
                    loadingPosition="start"
                    loading={findTripQuery.isLoading && findClicked}
                    startIcon={<SearchIcon />}
                  >
                    Find
                  </LoadingButton>
                </Box>
                <Box
                  display="grid"
                  gap="30px"
                  gridTemplateColumns="repeat(4, minmax(0, 1fr))"
                  sx={{
                    "& > div": {
                      gridColumn: isNonMobile ? undefined : "span 4",
                    },
                  }}
                >
                  <Box
                    display="flex"
                    alignItems="center"
                    sx={{
                      gridColumn: "span 4",
                    }}
                  >
                    <Autocomplete
                      id="source-province-autocomplete"
                      fullWidth
                      value={selectedSource}
                      onOpen={handleProvinceOpen}
                      onChange={(e, newValue) => {
                        setFindClicked(false);
                        setSelectedSource(newValue);
                      }}
                      getOptionLabel={(option) => option.name}
                      options={provinceQuery.data ?? []}
                      loading={provinceClicked && provinceQuery.isLoading}
                      sx={{
                        gridColumn: "span 2",
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          name="source"
                          label="From"
                          color="warning"
                          size="small"
                          fullWidth
                          variant="outlined"
                          // onBlur={handleBlur}
                          // error={!!touched.source && !!errors.source}
                          // helperText={touched.source && errors.source}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {provinceClicked && provinceQuery.isLoading ? (
                                  <CircularProgress color="inherit" size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                    <IconButton onClick={handleSwapLocation}>
                      <SwapHorizIcon />
                    </IconButton>
                    <Autocomplete
                      id="dest-province-autocomplete"
                      fullWidth
                      value={selectedDestination}
                      onOpen={handleProvinceOpen}
                      onChange={(e, newValue) => {
                        setFindClicked(false);
                        setSelectedDestination(newValue);
                      }}
                      getOptionLabel={(option) => option.name}
                      options={provinceQuery.data ?? []}
                      loading={provinceClicked && provinceQuery.isLoading}
                      sx={{
                        gridColumn: "span 2",
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          name="destination"
                          label="To"
                          color="warning"
                          size="small"
                          fullWidth
                          variant="outlined"
                          // onBlur={handleBlur}
                          // error={!!touched.destination && !!errors.destination}
                          // helperText={touched.destination && errors.destination}
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {provinceClicked && provinceQuery.isLoading ? (
                                  <CircularProgress color="inherit" size={20} />
                                ) : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  </Box>
                </Box>

                <Box m="40px 0">
                  {findTripQuery.isLoading && findClicked ? (
                    <Box textAlign="center">
                      <CircularProgress color="info" />
                    </Box>
                  ) : findTripQuery.data?.length !== 0 ? (
                    <List
                      sx={{
                        width: "100%",
                        position: "relative",
                        overflow: "auto",
                        maxHeight: 200,
                      }}
                    >
                      {(findTripQuery.data ?? []).map((trip) => (
                        <ListItemButton
                          disableRipple
                          key={trip.id}
                          sx={{ textAlign: "center" }}
                        >
                          <ListItemText
                            onClick={() => {
                              setOpenRouteModal(false);
                              setFieldValue("trip", trip);
                            }}
                            primary={`[${trip.departureTime}] ${trip.source.name} \u21D2 ${trip.destination.name}`}
                            secondary={`Type: ${trip.coach.coachType}, Price: ${
                              trip.price ? trip.price : "none"
                            }`}
                          />
                        </ListItemButton>
                      ))}
                    </List>
                  ) : (
                    <Box
                      width="100%"
                      textAlign="center"
                      sx={{
                        color:
                          theme.palette.mode === "dark"
                            ? "rgba(255, 255, 255, .4)"
                            : "rgba(0, 0, 0, .3)",
                      }}
                    >
                      <DoNotDisturbAltOutlinedIcon
                        sx={{
                          width: "100px",
                          height: "100px",
                        }}
                      />
                      <Typography variant={"h4"}>No result</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Modal>
          </form>
        )}
      </Formik>
    </Box>
  );
};

export default BookingForm;
