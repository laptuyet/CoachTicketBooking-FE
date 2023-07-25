import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import ClearIcon from "@mui/icons-material/Clear";
import CommuteOutlinedIcon from "@mui/icons-material/CommuteOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PersonIcon from "@mui/icons-material/Person";
import PriorityHighOutlinedIcon from "@mui/icons-material/PriorityHighOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Modal,
  Skeleton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomDataTable from "../../components/CustomDataTable";
import CustomToolTip from "../../components/CustomToolTip";
import Header from "../../components/Header";
import { tokens } from "../../theme";
import { handleToast } from "../../utils/helpers";
import { useQueryString } from "../../utils/useQueryString";
import * as tripApi from "../trip/tripQueries";
import * as userApi from "../user/userQueries";
import * as ticketApi from "./ticketQueries";

const Ticket = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [openUserModal, setOpenUserModal] = useState(false);
  const [openTripModal, setOpenTripModal] = useState(false);
  const [openBookingModal, setOpenBookingModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedTrip, setSelectedTrip] = useState("");
  const [filtering, setFiltering] = useState("");

  const queryClient = useQueryClient();

  const bookingQuery = useQuery({
    queryKey: ["bookings", selectedRow],
    queryFn: () => ticketApi.getBooking(selectedRow),
    enabled: selectedRow !== "",
  });

  const userQuery = useQuery({
    queryKey: ["users", selectedUser],
    queryFn: () => userApi.getUser(selectedUser),
    enabled: selectedUser !== "",
  });

  const tripQuery = useQuery({
    queryKey: ["trips", selectedTrip],
    queryFn: () => tripApi.getTrip(selectedTrip),
    enabled: selectedTrip !== "",
  });

  // Columns
  const columns = useMemo(
    () => [
      {
        header: "Customer",
        accessorKey: "user",
        footer: "Customer",
        width: 120,
        maxWidth: 250,
        isEllipsis: true,
        cell: (info) => {
          const { username, firstName, lastName } = info.getValue();
          return (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-around"
            >
              {firstName} {lastName}
              <CustomToolTip title="Detail" placement="top">
                <IconButton
                  onClick={() => {
                    setSelectedUser(username);
                    setOpenUserModal(!openUserModal);
                  }}
                >
                  <PersonIcon />
                </IconButton>
              </CustomToolTip>
            </Box>
          );
        },
      },
      {
        header: "Route",
        accessorKey: "trip",
        footer: "Route",
        width: 350,
        maxWidth: 300,
        isEllipsis: true,
        align: "center",
        cell: (info) => {
          const { id, source, destination } = info.getValue();
          return (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-around"
            >
              {source.name}
              {info.row.original.bookingType === "ONEWAY" ? (
                <span style={{ margin: "0 6px" }}>&rArr;</span>
              ) : (
                <span style={{ margin: "0 6px" }}>&hArr;</span>
              )}
              {destination.name}
              <CustomToolTip title="Detail" placement="top">
                <IconButton
                  onClick={() => {
                    setSelectedTrip(id);
                    setOpenTripModal(!openTripModal);
                  }}
                >
                  <CommuteOutlinedIcon />
                </IconButton>
              </CustomToolTip>
            </Box>
          );
        },
      },
      {
        header: "Departure Time",
        accessorKey: "trip.departureTime",
        footer: "Departure Time",
        width: 100,
        maxWidth: 200,
        align: "center",
      },
      {
        header: "Seat Number",
        accessorKey: "seatNumber",
        footer: "Seat Number",
        width: 80,
        maxWidth: 200,
        align: "center",
      },
      {
        header: "Payment",
        accessorKey: "payment",
        footer: "Payment",
        width: 100,
        maxWidth: 200,
        align: "center",
        cell: (info) => {
          const { paymentStatus } = info.row.original;
          return (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-around"
            >
              {paymentStatus}
              <CustomToolTip title="Detail" placement="top">
                <IconButton
                  onClick={() => {
                    setSelectedRow(info.row.original.id);
                    setOpenBookingModal(!openBookingModal);
                  }}
                >
                  <PriorityHighOutlinedIcon />
                </IconButton>
              </CustomToolTip>
            </Box>
          );
        },
      },
      {
        header: "Action",
        accessorKey: "action",
        footer: "Action",
        width: 120,
        maxWidth: 250,
        align: "center",
        cell: (info) => {
          return (
            <Box>
              <CustomToolTip title="Edit" placement="top">
                <IconButton
                  onClick={() => {
                    navigate(`${info.row.original.id}`);
                  }}
                >
                  <EditOutlinedIcon />
                </IconButton>
              </CustomToolTip>
              <CustomToolTip title="Delete" placement="top">
                <IconButton
                  onClick={() => {
                    setSelectedRow(`${info.row.original.id}`);
                    setOpenModal(!openModal);
                  }}
                >
                  <DeleteOutlineOutlinedIcon />
                </IconButton>
              </CustomToolTip>
            </Box>
          );
        },
      },
    ],
    []
  );

  const [queryObj, setSearchParams] = useQueryString();
  const page = Number(queryObj?.page) || 1;
  const limit = Number(queryObj?.limit) || 5;

  const [pagination, setPagination] = useState({
    pageIndex: page - 1,
    pageSize: limit,
  });

  // Get page of Trip
  const { data } = useQuery({
    queryKey: ["bookings", pagination],
    queryFn: () => {
      setSearchParams({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      return ticketApi.getPageOfBookings(
        pagination.pageIndex,
        pagination.pageSize
      );
    },
    keepPreviousData: true,
  });

  const prefetchAllBookings = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["bookings", "all"],
      queryFn: () => ticketApi.getAll(),
    });
  };

  // create deleteMutation
  const deleteMutation = useMutation({
    mutationFn: (bookingId) => ticketApi.deleteBooking(bookingId),
  });

  // Handle delete Coach
  const handleDeleteBooking = (bookingId) => {
    deleteMutation.mutate(bookingId, {
      onSuccess: (data) => {
        setOpenModal(!openModal);
        queryClient.invalidateQueries({ queryKey: ["bookings", pagination] });
        handleToast("success", data);
      },
      onError: (error) => {
        console.log("Delete Booking ", error);
        handleToast("error", error.response?.data.message);
      },
    });
  };

  const table = useReactTable({
    data: data?.dataList ?? [], // if data is not available, provide empty dataList []
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    pageCount: data?.pageCount ?? -1,
    state: {
      pagination,
      globalFilter: filtering,
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setFiltering,
    manualPagination: true,
  });

  return (
    <Box m="20px">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Bookings" subTitle="Booking management" />
        {/*Table search input */}
        <Box
          width="350px"
          height="40px"
          display="flex"
          bgcolor={colors.primary[400]}
          borderRadius="3px"
        >
          <InputBase
            sx={{ ml: 2, flex: 1 }}
            placeholder="Search"
            value={filtering}
            onMouseEnter={async () => await prefetchAllBookings()}
            onClick={() => {
              table.setPageSize(data?.totalElements);
            }}
            onChange={(e) => setFiltering(e.target.value)}
          />
          <IconButton type="button" sx={{ p: 1 }}>
            <SearchIcon />
          </IconButton>
        </Box>
        <Link to="new" style={{ alignSelf: "end", marginBottom: "30px" }}>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            size="large"
          >
            Add new
          </Button>
        </Link>
      </Box>

      {/* Table */}
      <CustomDataTable
        table={table}
        colors={colors}
        totalElements={data?.totalElements}
      />

      {/* USER DETAIL MODAL */}
      <Modal
        sx={{
          "& .MuiBox-root": {
            bgcolor:
              theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
          },
        }}
        open={openUserModal}
        onClose={() => setOpenUserModal(!openUserModal)}
        aria-labelledby="modal-userModal-title"
        aria-describedby="modal-userModal-description"
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
          <Box textAlign="center" marginBottom="30px">
            <Typography variant="h4">USER DETAIL</Typography>
          </Box>
          {userQuery.isLoading ? (
            <Stack spacing={1}>
              {/* For variant="text", adjust the height via font-size */}
              <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
              {/* For other variants, adjust the size with `width` and `height` */}
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="rectangular" width={210} height={60} />
              <Skeleton variant="rounded" width={210} height={60} />
            </Stack>
          ) : (
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
            >
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Full Name"
                name="fullName"
                value={`${userQuery?.data?.firstName} ${userQuery?.data?.lastName}`}
                sx={{
                  gridColumn: "span 4",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Phone"
                name="phone"
                value={userQuery?.data?.phone}
                sx={{
                  gridColumn: "span 4",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Email"
                name="email"
                value={userQuery?.data?.email}
                sx={{
                  gridColumn: "span 4",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Address"
                name="address"
                value={userQuery?.data?.address}
                sx={{
                  gridColumn: "span 4",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Date of Birth"
                name="dob"
                value={userQuery.data.dob}
                sx={{
                  gridColumn: "span 4",
                }}
              />
            </Box>
          )}
        </Box>
      </Modal>

      {/* TRIP DETAIL MODAL */}
      <Modal
        sx={{
          "& .MuiBox-root": {
            bgcolor:
              theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
          },
        }}
        open={openTripModal}
        onClose={() => setOpenTripModal(!openTripModal)}
        aria-labelledby="modal-tripModal-title"
        aria-describedby="modal-tripModal-description"
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
          <Box textAlign="center" marginBottom="30px">
            <Typography variant="h4">TRIP DETAIL</Typography>
          </Box>
          {tripQuery.isLoading ? (
            <Stack spacing={1}>
              {/* For variant="text", adjust the height via font-size */}
              <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
              {/* For other variants, adjust the size with `width` and `height` */}
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="rectangular" width={210} height={60} />
              <Skeleton variant="rounded" width={210} height={60} />
            </Stack>
          ) : (
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
            >
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="From"
                name="from"
                value={tripQuery?.data?.source.name}
                sx={{
                  gridColumn: "span 2",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="To"
                name="to"
                value={tripQuery?.data?.destination.name}
                sx={{
                  gridColumn: "span 2",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Driver"
                name="driver"
                value={`${tripQuery?.data?.driver.firstName} ${tripQuery?.data?.driver.lastName}`}
                sx={{
                  gridColumn: "span 4",
                }}
              />

              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Coach"
                name="coach"
                value={`${tripQuery?.data?.coach.name}\t\tTYPE:${tripQuery?.data?.coach.coachType}`}
                sx={{
                  gridColumn: "span 4",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Price"
                name="price"
                value={tripQuery?.data?.price}
                sx={{
                  gridColumn: "span 2",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Discount"
                name="discount"
                value={
                  tripQuery?.data?.discount
                    ? tripQuery?.data?.discount.amount
                    : "NONE"
                }
                sx={{
                  gridColumn: "span 2",
                }}
              />
            </Box>
          )}
        </Box>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal
        sx={{
          "& .MuiBox-root": {
            bgcolor:
              theme.palette.mode === "dark" ? colors.primary[400] : "#fff",
          },
        }}
        open={openBookingModal}
        onClose={() => setOpenBookingModal(!openBookingModal)}
        aria-labelledby="modal-paymentModal-title"
        aria-describedby="modal-paymentModal-description"
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
          <Box textAlign="center" marginBottom="30px">
            <Typography variant="h4">PAYMENT DETAIL</Typography>
          </Box>
          {bookingQuery.isLoading ? (
            <Stack spacing={1}>
              {/* For variant="text", adjust the height via font-size */}
              <Skeleton variant="text" sx={{ fontSize: "1rem" }} />
              {/* For other variants, adjust the size with `width` and `height` */}
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="rectangular" width={210} height={60} />
              <Skeleton variant="rounded" width={210} height={60} />
            </Stack>
          ) : (
            <Box
              display="grid"
              gap="30px"
              gridTemplateColumns="repeat(4, minmax(0, 1fr))"
            >
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Total"
                name="totalPayment"
                value={bookingQuery?.data?.totalPayment}
                sx={{
                  gridColumn: "span 2",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Date time"
                name="paymentDateTime"
                value={bookingQuery?.data?.paymentDateTime}
                sx={{
                  gridColumn: "span 2",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Method"
                name="paymentMethod"
                value={bookingQuery?.data?.paymentMethod}
                sx={{
                  gridColumn: "span 2",
                }}
              />
              <TextField
                color="warning"
                size="small"
                fullWidth
                variant="outlined"
                type="text"
                label="Status"
                name="paymentStatus"
                value={bookingQuery?.data?.paymentStatus}
                sx={{
                  gridColumn: "span 2",
                }}
              />
            </Box>
          )}
        </Box>
      </Modal>

      {/* ACTION MODAL */}
      <Modal
        sx={{
          "& .MuiBox-root": {
            bgcolor:
              theme.palette.mode === "dark" ? colors.blueAccent[700] : "#fff",
          },
        }}
        open={openModal}
        onClose={() => setOpenModal(!openModal)}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            borderRadius: "10px",
            boxShadow: 24,
            p: 4,
          }}
        >
          <Typography
            id="modal-modal-title"
            variant="h3"
            textAlign="center"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <WarningRoundedIcon
              sx={{ color: "#fbc02a", fontSize: "2.5rem", marginRight: "4px" }}
            />{" "}
            Cancel Booking&nbsp;
            <span
              style={{
                fontStyle: "italic",
              }}
            >
              {selectedRow} ?
            </span>
          </Typography>
          <Typography textAlign="center" fontStyle="italic">
            * This will turn payment status to CANCEL
          </Typography>
          <Box
            id="modal-modal-description"
            sx={{ mt: 3 }}
            display="flex"
            justifyContent="space-around"
          >
            <Button
              variant="contained"
              color="error"
              startIcon={<CheckIcon />}
              onClick={() => handleDeleteBooking(selectedRow)}
            >
              Confirm
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<ClearIcon />}
              onClick={() => setOpenModal(!openModal)}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default Ticket;
