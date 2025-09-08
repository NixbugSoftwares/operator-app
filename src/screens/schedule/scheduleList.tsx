import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
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
import {
  scheduleListingApi,
  fareListApi,
  busRouteListApi,
  companyBusListApi,
} from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { RootState } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import PaginationControls from "../../common/paginationControl";
import FormModal from "../../common/formModal";
import ScheduleCreationForm from "./CreationForm";
import { Schedule } from "../../types/type";
import ScheduleDetailsCard from "./DetailCard";
import { useLocation, useParams } from "react-router-dom";

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
    Automatic: "1",
    Manual: "2",
    Disabled: "3",
  };
  return createdModMap[displayValue] || "";
};

type SearchFilter = {
  id: string;
  name: string;
  ticketing_mode: string;
  triggering_mode: string;
  permit_no: string;
};

const ScheduleListingTable = () => {
  const { companyId } = useParams();
  const location = useLocation();
  const [filterCompanyId, setFilterCompanyId] = useState<number>(
    companyId ? parseInt(companyId) : 0
  );
  const dispatch = useDispatch<AppDispatch>();
  const [scheduleList, setScheduleList] = useState<Schedule[]>([]);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(
    null
  );
  const [search, setSearch] = useState<SearchFilter>({
    id: "",
    name: "",
    ticketing_mode: "",
    triggering_mode: "",
    permit_no: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState<SearchFilter>(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canCreateSchedule = useSelector((state: RootState) =>
    state.app.permissions.includes("create_schedule")
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);

  // State for related entity names
  const [relatedNames, setRelatedNames] = useState({
    routeName: "Loading...",
    busName: "Loading...",
    fareName: "Loading...",
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const urlCompanyId = companyId || queryParams.get("companyId");

    if (urlCompanyId) {
      const id = parseInt(urlCompanyId);
      if (!isNaN(id)) {
        setFilterCompanyId(id);
      }
    }
  }, [companyId, location.search]);

  const fetchScheduleList = useCallback(
    (pageNumber: number, searchParams: Partial<SearchFilter> = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;

      const backendSearchParams = {
        ...searchParams,
        ticketing_mode: searchParams.ticketing_mode
          ? +getTicketModeBackendValue(searchParams.ticketing_mode)
          : undefined,
        triggering_mode: searchParams.triggering_mode
          ? +getTriggerModeBackendValue(searchParams.triggering_mode)
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
            ticketing_mode:
              schedule.ticketing_mode === 1
                ? "Hybrid"
                : schedule.ticketing_mode === 2
                ? "Digital"
                : schedule.ticketing_mode === 3
                ? "Conventional"
                : "",
            triggering_mode:
              schedule.triggering_mode === 1
                ? "Automatic"
                : schedule.triggering_mode === 2
                ? "Manual"
                : schedule.triggering_mode === 3
                ? "Disabled"
                : "",
            frequency: Array.isArray(schedule.frequency)
              ? schedule.frequency
              : [],
            created_on: schedule.created_on,
            updated_on: schedule.updated_on,
          }));

          setScheduleList(formattedSchedules);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error: any) => {
          console.error("Fetch Error:", error);
          showErrorToast(error.message || "Failed to fetch Service list");
        })
        .finally(() => setIsLoading(false));
    },
    [dispatch, filterCompanyId]
  );

  // Function to fetch related entity names
  const fetchRelatedNames = useCallback(
    async (schedule: Schedule) => {
      try {
        // Fetch route name
        const routeResponse = await dispatch(
          busRouteListApi({ id: schedule.route_id })
        ).unwrap();
        const routeName = routeResponse.data[0]?.name || "Route not found";

        // Fetch bus name
        const busResponse = await dispatch(
          companyBusListApi({ id: schedule.bus_id,})
        ).unwrap();
        const busName = busResponse.data[0]?.name || "Bus not found";

        // Fetch fare name
        const fareResponse = await dispatch(
          fareListApi({ id: schedule.fare_id })
        ).unwrap();
        const fareName = fareResponse.data[0]?.name || "Fare not found";

        setRelatedNames({
          routeName,
          busName,
          fareName,
        });
      } catch (error) {
        console.error("Error fetching related names:", error);
        setRelatedNames({
          routeName: "Error loading route",
          busName: "Error loading bus",
          fareName: "Error loading fare",
        });
      }
    },
    [dispatch]
  );

  const handleRowClick = async (schedule: Schedule) => {
    setSelectedSchedule(schedule);
    // Fetch related names when a schedule is selected
    await fetchRelatedNames(schedule);
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
    fetchScheduleList(page, debouncedSearch);
  }, [page, debouncedSearch, fetchScheduleList]);

  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchScheduleList(page, debouncedSearch);
    }
  };

  return (
    <Box
      sx={{
      display: "flex",
      flexDirection: { xs: "column", lg: "row" },
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
        {canCreateSchedule && (
          <Button
            sx={{
            ml: "auto",
            mr: 2,
            mb: 2,
            px: 1.5,
            py: 0.5,
            fontSize: "0.75rem",
            height: 36,
            backgroundColor: canCreateSchedule ? "#00008B" : "#6c87b7 !important",
            color: "white",
          }}
            variant="contained"
            onClick={() => setOpenCreateModal(true)}
            disabled={!canCreateSchedule}
          >
            Add New Schedule
          </Button>
        )}

        <TableContainer
         sx={{
          flex: 1,
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
          borderRadius: 2,
          border: "1px solid #e0e0e0",
          position: "relative",
        }}
        >
          {isLoading && (
            <Box
              sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.7)",
              zIndex: 1,
            }}
            >
              <CircularProgress />
            </Box>
          )}
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {[
                  { label: "ID", width: 80, key: "id" },
                  { label: "Name", width: 200, key: "name" },
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
                  {
                    key: "ticketing_mode",
                    isSelect: true,
                    options: ["Hybrid", "Digital", "Conventional"],
                  },
                  {
                    key: "triggering_mode",
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
                          
                        minWidth: { xs: 80, sm: "100%" },
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center"></TableCell>
                </TableRow>
              ) : scheduleList.length > 0 ? (
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
                      <Typography noWrap>
                        <Tooltip title={row.name} placement="bottom">
                          <Typography noWrap>
                            {row.name.length > 15
                              ? `${row.name.substring(0, 15)}...`
                              : row.name}
                          </Typography>
                        </Tooltip>
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.ticketing_mode}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            String(row.ticketing_mode) === "Hybrid"
                              ? "rgba(0, 150, 136, 0.15)"
                              : String(row.ticketing_mode) === "Digital"
                              ? "rgba(33, 150, 243, 0.15)"
                              : "rgba(255, 87, 34, 0.15)",
                          color:
                            String(row.ticketing_mode) === "Hybrid"
                              ? "#009688"
                              : String(row.ticketing_mode) === "Digital"
                              ? "#2196F3"
                              : "#FF5722",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                        }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.triggering_mode}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            String(row.triggering_mode) === "Automatic"
                              ? "rgba(33, 150, 243, 0.12)"
                              : String(row.triggering_mode) === "Manual"
                              ? "rgba(255, 152, 0, 0.15)"
                              : String(row.triggering_mode) === "Disabled"
                              ? "rgba(244, 67, 54, 0.12)"
                              : "rgba(158, 158, 158, 0.12)",
                          color:
                            String(row.triggering_mode) === "Automatic"
                              ? "#1976D2"
                              : String(row.triggering_mode) === "Manual"
                              ? "#FF9800"
                              : String(row.triggering_mode) === "Disabled"
                              ? "#D32F2F"
                              : "#616161",
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
                    No Schedule Found.
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
            display: { xs: "none", lg: "block" }, // ✅ Only show on large screens
            flex: "0 0 35%",
            maxWidth: "35%",
            transition: "all 0.3s ease",
            bgcolor: "grey.100",
            p: 2,
            overflowY: "auto",
            height: "100%",
          }}
        >
          <ScheduleDetailsCard
            schedule={selectedSchedule}
            relatedNames={relatedNames} // Pass the related names to the details card
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedSchedule(null)}
            refreshList={(value: any) => refreshList(value)}
            onCloseDetailCard={() => setSelectedSchedule(null)}
          />
        </Box>
      )}
      <Dialog
        open={Boolean(selectedSchedule)}
        onClose={() => setSelectedSchedule(null)}
        fullScreen
        sx={{ display: { xs: "block", lg: "none" } }} // ✅ Show on mobile + tablet
      >
        {selectedSchedule && (
          <Box sx={{ p: 2 }}>
            <ScheduleDetailsCard
             schedule={selectedSchedule}
            relatedNames={relatedNames} 
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedSchedule(null)}
            refreshList={(value: any) => refreshList(value)}
            onCloseDetailCard={() => setSelectedSchedule(null)}
            />
          </Box>
        )}
      </Dialog>

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
