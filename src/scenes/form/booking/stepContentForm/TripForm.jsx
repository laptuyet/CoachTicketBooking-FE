import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CheckCircleOutlineOutlinedIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import CircleOutlinedIcon from "@mui/icons-material/CircleOutlined";
import DoNotDisturbAltOutlinedIcon from "@mui/icons-material/DoNotDisturbAltOutlined";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { LoadingButton } from "@mui/lab";
import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parse } from "date-fns";
import { useFormikContext } from "formik";
import React, { useState } from "react";
import { tokens } from "../../../../theme";
import * as provinceApi from "../../../global/provinceQueries";
import * as tripApi from "../../../trip/tripQueries";

const TripForm = ({ field, setActiveStep, bookingData, setBookingData }) => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [provinceClicked, setProvinceClicked] = useState(false);
  const [findClicked, setFindClicked] = useState(false);
  const [selectedItemIndex, setSelectedItemIndex] = useState(-1);
  const [selectedSource, setSelectedSource] = useState(
    bookingData.trip?.source ?? null
  );
  const [selectedDestination, setSelectedDestination] = useState(
    bookingData.trip?.destination ?? null
  );
  const formik = useFormikContext();
  const queryClient = useQueryClient();
  const { values, errors, touched, setFieldValue, handleChange, handleBlur } =
    field;

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

  // handle error when route is not selected
  const handleSelectedRoute = () => {
    if (selectedSource === null) {
      formik.setFieldTouched("source", true);
      formik.validateField("source");
    }
    if (selectedDestination === null) {
      formik.setFieldTouched("destination", true);
      formik.validateField("destination");
    }

    setFindClicked(true);
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
    <>
      <Box textAlign="center" mt="30px">
        <LoadingButton
          onClick={() => {
            handleSelectedRoute();
          }}
          color="info"
          variant="contained"
          loadingPosition="start"
          loading={
            findTripQuery.isLoading &&
            findClicked &&
            !!selectedSource &&
            !!selectedDestination
          }
          startIcon={<SearchIcon />}
        >
          Find
        </LoadingButton>
      </Box>
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
      <Box
        display="grid"
        gap="30px"
        gridTemplateColumns="repeat(4, minmax(0, 1fr))"
      >
        {/* choose location */}
        <Box
          display="flex"
          alignItems="center"
          sx={{
            gridColumn: "span 2",
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
              setFieldValue("source", newValue);
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
                onBlur={handleBlur}
                error={!!touched.source && !!errors.source}
                helperText={touched.source && errors.source}
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
              setFieldValue("destination", newValue);
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
                onBlur={handleBlur}
                error={!!touched.destination && !!errors.destination}
                helperText={touched.destination && errors.destination}
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

      {/* trip lists */}
      <Box m="40px 0">
        {findTripQuery.isLoading &&
        findClicked &&
        !!selectedSource &&
        !!selectedDestination ? (
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
            {(findTripQuery.data ?? []).map((trip, index) => (
              <ListItemButton
                disableRipple
                key={trip.id}
                sx={{ textAlign: "center" }}
              >
                <ListItemText
                  onClick={() => {
                    setFieldValue("trip", trip);
                    setFieldValue("seatNumber", []); // avoid old chosen seats when choose new Trip
                    setSelectedItemIndex(index);
                  }}
                  primary={`[${trip.departureTime}] ${trip.source.name} \u21D2 ${trip.destination.name}`}
                  secondary={`Type: ${trip.coach.coachType}, Price: ${
                    trip.price ? trip.price : "none"
                  }`}
                />
                <ListItemIcon>
                  <Checkbox
                    checked={
                      index === selectedItemIndex || values.trip === trip
                    }
                    tabIndex={-1}
                    disableRipple={true}
                    icon={<CircleOutlinedIcon />}
                    checkedIcon={<CheckCircleOutlineOutlinedIcon />}
                  />
                </ListItemIcon>
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
    </>
  );
};

export default TripForm;
