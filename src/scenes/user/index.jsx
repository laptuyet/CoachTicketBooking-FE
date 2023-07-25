import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import ClearIcon from "@mui/icons-material/Clear";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FemaleOutlinedIcon from "@mui/icons-material/FemaleOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MaleOutlinedIcon from "@mui/icons-material/MaleOutlined";
import SearchIcon from "@mui/icons-material/Search";
import WarningRoundedIcon from "@mui/icons-material/WarningRounded";
import {
  Box,
  Button,
  IconButton,
  InputBase,
  Modal,
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
import * as userApi from "./userQueries";

const User = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const navigate = useNavigate();
  const [openModal, setOpenModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState("");
  const [filtering, setFiltering] = useState("");
  const queryClient = useQueryClient();

  // Columns
  const columns = useMemo(
    () => [
      {
        header: "First Name",
        accessorKey: "firstName",
        footer: "First Name",
        width: 150,
        maxWidth: 200,
        isEllipsis: true,
      },
      {
        header: "Last Name",
        accessorKey: "lastName",
        footer: "Last Name",
        width: 100,
        maxWidth: 150,
        isEllipsis: true,
        align: "left",
      },
      {
        header: "Email",
        accessorKey: "email",
        footer: "Email",
        width: 180,
        maxWidth: 200,
        isEllipsis: true,
      },
      {
        header: "Phone",
        accessorKey: "phone",
        footer: "Phone",
        width: 100,
        maxWidth: 250,
        isEllipsis: true,
        align: "center",
      },
      {
        header: "Gender",
        accessorKey: "gender",
        footer: "Gender",
        width: 60,
        maxWidth: 150,

        align: "center",
        cell: (info) =>
          info.getValue() ? (
            <FemaleOutlinedIcon sx={{ color: "#f90070" }} />
          ) : (
            <MaleOutlinedIcon sx={{ color: "#00d1ef" }} />
          ),
      },
      {
        header: "Address",
        accessorKey: "address",
        footer: "Address",
        width: 150,
        maxWidth: 300,
        isEllipsis: true,
      },
      {
        header: "Active",
        accessorKey: "active",
        footer: "Active",
        width: 60,
        maxWidth: 150,
        align: "center",
        cell: (info) =>
          info.getValue() ? (
            <CheckOutlinedIcon sx={{ color: "#00e330" }} />
          ) : (
            <LockOutlinedIcon sx={{ color: "#eb0014" }} />
          ),
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
                    navigate(`${info.row.original.username}`);
                  }}
                >
                  <EditOutlinedIcon />
                </IconButton>
              </CustomToolTip>
              <CustomToolTip title="Delete" placement="top">
                <IconButton
                  onClick={() => {
                    setSelectedRow(`${info.row.original.username}`);
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

  // Get page of Users
  const { data } = useQuery({
    queryKey: ["users", pagination],
    queryFn: () => {
      setSearchParams({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      return userApi.getPageOfUser(pagination.pageIndex, pagination.pageSize);
    },
    keepPreviousData: true,
  });

  const prefetchAllUsers = async () => {
    await queryClient.prefetchQuery({
      queryKey: ["users", "all"],
      queryFn: () => userApi.getAll(),
    });
  };

  // create deleteMutation
  const deleteMutation = useMutation({
    mutationFn: (username) => userApi.deleteUser(username),
  });

  // Handle delete User
  const handleDeleteUser = (username) => {
    deleteMutation.mutate(username, {
      onSuccess: (data) => {
        setOpenModal(!openModal);
        queryClient.invalidateQueries({ queryKey: ["users", pagination] });
        handleToast("success", data);
      },
      onError: (error) => {
        console.log("Delete User ", error);
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
        <Header title="USERS" subTitle="User management" />
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
            onMouseEnter={async () => await prefetchAllUsers()}
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

      {/* MODAL */}
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
            Delete User&nbsp;
            <span
              style={{
                fontStyle: "italic",
              }}
            >
              {selectedRow} ?
            </span>
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
              onClick={() => handleDeleteUser(selectedRow)}
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

export default User;