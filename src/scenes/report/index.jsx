import SquareIcon from "@mui/icons-material/Square";
import { Box, Typography } from "@mui/material";
import React, { useState } from "react";
import Bed_Limousine_Seat_Data from "../form/booking/SeatModels/Bed_Limousine_Seat_Data";
import SeatModel from "../form/booking/SeatModels/SeatModel";

const Report = () => {
  const [seatData, setSeatData] = useState(Bed_Limousine_Seat_Data);
  const coachType = "BED";
  const handleSeatChoose = (seatNumber, STAIR, isSelected) => {
    // if chosen seat is clicked then do nothing
    if (seatData[STAIR][seatNumber].isOrdered) return;
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
  };

  return (
    <>
      {/* render seat */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap="100px"
        mt="50px"
      >
        {/* COLUMN 1 */}
        <Box
          display="grid"
          gap="8px"
          gridTemplateColumns="repeat(3, minmax(0, 1fr))"
        >
          {Object.entries(seatData.DOWN_STAIR).map((values, index) => {
            return (
              <SeatModel
                key={values[0]}
                handleSeatChoose={handleSeatChoose}
                seat={values[1]}
                coachType={coachType}
              />
            );
          })}
        </Box>

        {/* COLUMN 2 */}
        <Box
          display="grid"
          gap="8px"
          gridTemplateColumns="repeat(3, minmax(0, 1fr))"
        >
          {Object.entries(seatData.UP_STAIR).map((values) => {
            return (
              <SeatModel
                key={values[0]}
                handleSeatChoose={handleSeatChoose}
                seat={values[1]}
                coachType={coachType}
              />
            );
          })}
        </Box>
      </Box>

      {/* render seat tip */}
      <Box mt="40px" display="flex" justifyContent="center" gap="40px">
        <Box textAlign="center">
          <SquareIcon
            sx={{
              borderRadius: "20px",
              width: "35px",
              height: "35px",
              color: "#000",
            }}
          />
          <Typography fontWeight="bold">Ordered</Typography>
        </Box>
        <Box textAlign="center">
          <SquareIcon
            sx={{
              borderRadius: "20px",
              width: "35px",
              height: "35px",
              color: "#979797",
            }}
          />
          <Typography fontWeight="bold">Empty</Typography>
        </Box>
        <Box textAlign="center">
          <SquareIcon
            sx={{
              borderRadius: "20px",
              width: "35px",
              height: "35px",
              color: "#ff4138",
            }}
          />
          <Typography fontWeight="bold">Choosing</Typography>
        </Box>
      </Box>
    </>
  );
};

export default Report;
