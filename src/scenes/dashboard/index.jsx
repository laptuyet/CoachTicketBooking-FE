import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import Header from "../../components/Header";
import { http } from "../../utils/http";

const DashBoard = () => {
  const { isLoading, isError, data, error, isFetching } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const resp = await http.get("/users/all");
      return resp.data;
    },
  });

  if (isLoading) return <div>Loading</div>;
  if (isError) return <div>{error.message}</div>;

  return (
    <>
      <Box m="20px">
        <Header title="DASHBOARD" subTitle="Welcome to admin's dashboard" />
        <Box>
          {data.map((user, index) => (
            <div key={index}>{user.lastName}</div>
          ))}
        </Box>
      </Box>
    </>
  );
};

export default DashBoard;
