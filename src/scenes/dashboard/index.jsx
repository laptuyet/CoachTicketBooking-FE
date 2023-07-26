import React from "react";
import { Box, useTheme } from "@mui/material";
import * as reportApi from "../report/reportQueries";
import Header from "../../components/Header";
import { useQuery } from "@tanstack/react-query";
import { tokens } from "../../theme";
import BarChart from "../../components/BarChart";
import { format } from "date-fns";

const DashBoard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const weekRevenueQuery = useQuery({
    queryKey: ["reports", "weeks"],
    queryFn: () =>
      reportApi.getTotalWeekRevenue(format(new Date(), "yyyy-MM-dd")),
  });

  return (
    <Box m="20px">
      <Header title="DASHBOARD" subTitle="Welcome to your dashboard" />
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="300px"
        gap="20px"
      >
        <Box
          borderRadius="5px"
          gridColumn="span 8"
          display="flex"
          backgroundColor={colors.primary[400]}
          justifyContent="center"
          alignItems="center"
        >
          {weekRevenueQuery.isSuccess && (
            <BarChart entries={weekRevenueQuery?.data.reportData} />
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default DashBoard;
