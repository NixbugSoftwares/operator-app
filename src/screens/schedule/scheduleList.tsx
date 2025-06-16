import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { scheduleListingApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { RootState } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import PaginationControls from "../../common/paginationControl";
import FormModal from "../../common/formModal";
import ScheduleCreationForm from "./CreationForm";
import { Schedule } from "../../types/type";
import ScheduleDetailsCard from "./DetailCard";

// Utility functions for converting between display and backend values
const getTicketModeBackendValue = (displayValue: string): string => {
  const ticketMap: Record<string, string> = {
    Hybrid: "1",
    Digital: "2",
    Conventional: "3",
  };
  return ticketMap[displayValue] || "";
};

const getTriggerModeBackendValue = (displayValue: string): string => {
  const createdModMap: Record<string, string> = {
    Auto: "1",
    Manual: "2",
    Disabled: "3",
  };
  return createdModMap[displayValue] || "";
};

// Define search filter types
type SearchFilter = {
  id: string;
  name: string;
  ticket_mode: string;
  trigger_mode: string;
  permit_no: string;
};

const ScheduleListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [search, setSearch] = useState<SearchFilter>({
    id: "",
    name: "",
    ticket_mode: "",
    trigger_mode: "",
    permit_no: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState<SearchFilter>(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canManageSchedule = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_schedule")
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const fetchServiceList = useCallback(
    (pageNumber: number, searchParams: Partial<SearchFilter> = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;

      // Convert display values to backend values
      const backendSearchParams = {
        ...searchParams,
        ticket_mode: searchParams.ticket_mode
          ? +getTicketModeBackendValue(searchParams.ticket_mode)
          : undefined,
        trigger_mode: searchParams.trigger_mode
          ? +getTriggerModeBackendValue(searchParams.trigger_mode)
          : undefined,
      };

      dispatch(
        scheduleListingApi({
          limit: rowsPerPage,
          offset,
          ...backendSearchParams,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];

          const formattedSchedules = items.map((schedule: any) => ({
  id: schedule.id,
  name: schedule.name,
  permit_no: schedule.permit_no,
  route_id: schedule.route_id,
  fare_id: schedule.fare_id,
  bus_id: schedule.bus_id,
  ticket_mode:
    schedule.ticket_mode === 1
      ? "Hybrid"
      : schedule.ticket_mode === 2
      ? "Digital"
      : "Conventional",
  trigger_mode:
    schedule.trigger_mode === 1
      ? "Automatic"
      : schedule.trigger_mode === 2
      ? "Manual"
      : "Disabled",
  frequency: Array.isArray(schedule.frequency)
    ? schedule.frequency
    : [], 
}));


          setScheduleList(formattedSchedules);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error) => {
          console.error("Fetch Error:", error);
          showErrorToast(error.message || "Failed to fetch Service list");
        })
        .finally(() => setIsLoading(false));
    },
    [dispatch]
  );

  const handleRowClick = (schedule: Schedule) => {
    setSelectedSchedule(schedule);
  };

  const handleSearchChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      column: keyof SearchFilter
    ) => {
      const value = e.target.value;
      setSearch((prev) => ({ ...prev, [column]: value }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setDebouncedSearch((prev) => ({ ...prev, [column]: value }));
        setPage(0);
      }, 700);
    },
    []
  );

  const handleSelectChange = useCallback(
    (e: SelectChangeEvent<string>, column: keyof SearchFilter) => {
      const value = e.target.value;
      setSearch((prev) => ({ ...prev, [column]: value }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setDebouncedSearch((prev) => ({ ...prev, [column]: value }));
        setPage(0);
      }, 700);
    },
    []
  );

  const handleChangePage = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  useEffect(() => {
    fetchServiceList(page, debouncedSearch);
  }, [page, debouncedSearch, fetchServiceList]);

  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchServiceList(page, debouncedSearch);
    }
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        height: "100%",
        gap: 2,
      }}
    >
      <Box
        sx={{
          flex: selectedSchedule
            ? { xs: "0 0 100%", md: "0 0 65%" }
            : "0 0 100%",
          maxWidth: selectedSchedule ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tooltip
          title={
            !canManageSchedule
              ? "You don't have permission, contact the admin"
              : "Click to open the Schedule creation form"
          }
          placement="top-end"
        >
          <span
            style={{ cursor: !canManageSchedule ? "not-allowed" : "pointer" }}
          >
            <Button
              sx={{
                ml: "auto",
                mr: 2,
                mb: 2,
                backgroundColor: !canManageSchedule
                  ? "#6c87b7 !important"
                  : "#00008B",
                color: "white",
                display: "flex",
                justifyContent: "flex-end",
              }}
              variant="contained"
              onClick={() => setOpenCreateModal(true)}
              disabled={!canManageSchedule}
            >
              Add New Schedule
            </Button>
          </span>
        </Tooltip>

        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  { label: "ID", width: 80, key: "id" },
                  { label: "Name", width: 200, key: "name" },
                  { label: "Permit Number", width: 160, key: "permit_number" },
                  { label: "Ticket Mode", width: 160, key: "ticket_mode" },
                  { label: "Trigger Mode", width: 160, key: "trigger_mode" },
                ].map((col) => (
                  <TableCell
                    key={col.key}
                    sx={{
                      textAlign: "center",
                      width: col.width,
                      minWidth: col.width,
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>

              {/* Search Filters Row */}
              <TableRow>
                {[
                  { key: "id", isNumber: true },
                  { key: "name", isNumber: false },
                  { key: "permit_number", isNumber: false },
                  {
                    key: "ticket_mode",
                    isSelect: true,
                    options: ["Hybrid", "Digital", "Conventional"],
                  },
                  {
                    key: "trigger_mode",
                    isSelect: true,
                    options: ["Automatic", "Manual", "Disabled"],
                  },
                ].map(({ key, isNumber, isSelect, options }) => (
                  <TableCell key={key}>
                    {isSelect ? (
                      <Select
                        value={search[key as keyof SearchFilter]}
                        onChange={(e) =>
                          handleSelectChange(e, key as keyof SearchFilter)
                        }
                        displayEmpty
                        size="small"
                        fullWidth
                        sx={{ height: 40 }}
                      >
                        <MenuItem value="">All</MenuItem>
                        {options?.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    ) : (
                      <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search"
                        value={search[key as keyof SearchFilter]}
                        onChange={(e) =>
                          handleSearchChange(e, key as keyof SearchFilter)
                        }
                        fullWidth
                        type={isNumber ? "number" : "text"}
                        sx={{
                          "& .MuiInputBase-root": {
                            height: 40,
                            padding: "4px",
                            textAlign: "center",
                            fontSize: selectedSchedule ? "0.8rem" : "1rem",
                          },
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                            fontSize: selectedSchedule ? "0.8rem" : "1rem",
                          },
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {scheduleList.length > 0 ? (
                scheduleList.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => handleRowClick(row)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedSchedule?.id === row.id ? "#E3F2FD" : "inherit",
                      "&:hover": { backgroundColor: "#E3F2FD" },
                    }}
                  >
                    <TableCell sx={{ textAlign: "center" }}>{row.id}</TableCell>
                    <TableCell>
                      <Typography noWrap>{row.name}</Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Typography noWrap>{row.permit_no}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.ticket_mode}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            String(row.ticket_mode) === "Hybrid"
                              ? "rgba(255, 193, 7, 0.12)"
                              : String(row.ticket_mode) === "Digital"
                              ? "rgba(0, 188, 212, 0.12)"
                              : "rgba(158, 158, 158, 0.12)",
                          color:
                            String(row.ticket_mode) === "Hybrid"
                              ? "#FF8F00"
                              : String(row.ticket_mode) === "Digital"
                              ? "#0097A7"
                              : "#616161",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.trigger_mode}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            String(row.trigger_mode) === "Automatic"
                              ? "rgba(158, 158, 158, 0.12)"
                              : String(row.trigger_mode) === "Manual"
                              ? "rgba(76, 175, 80, 0.12)"
                              : String(row.trigger_mode) === "Disabled"
                              ? "rgba(244, 67, 54, 0.12)"
                              : "rgba(103, 58, 183, 0.12)",
                          color:
                            String(row.trigger_mode) === "Automatic"
                              ? "#616161"
                              : String(row.trigger_mode) === "Manual"
                              ? "#2E7D32"
                              : String(row.trigger_mode) === "Disabled"
                              ? "#C62828"
                              : "#4527A0",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No Service found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <PaginationControls
          page={page}
          onPageChange={(newPage) => handleChangePage(null, newPage)}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
        />
      </Box>

      {selectedSchedule && (
        <Box
          sx={{
            flex: { xs: "0 0 100%", md: "0 0 35%" },
            maxWidth: { xs: "100%", md: "35%" },
            transition: "all 0.3s ease",
            bgcolor: "grey.100",
            p: 2,
            mt: { xs: 2, md: 0 },
            overflowY: "auto",
            overflowX: "hidden",
            height: "100%",
          }}
        >
          <ScheduleDetailsCard
            schedule={selectedSchedule}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedSchedule(null)}
            refreshList={(value: any) => refreshList(value)}
            canManageSchedule={canManageSchedule}
            onCloseDetailCard={() => setSelectedSchedule(null)}
          />
        </Box>
      )}

      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
      >
        <ScheduleCreationForm
          refreshList={refreshList}
          onClose={() => setOpenCreateModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default ScheduleListingTable;
