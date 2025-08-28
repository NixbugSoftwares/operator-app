import React, { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Checkbox,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Alert,
  TextField,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";
import { SelectChangeEvent } from "@mui/material";
import { useDispatch } from "react-redux";
import {
  dutyListingApi,
  operatorListApi,
  serviceListingApi,
  companyBusListApi,
} from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Duty, Service, Account, Bus } from "../../types/type";
import PaginationControls from "../../common/paginationControl";
import nodataimage from "../../assets/svg/noData.svg";
interface SelectedService {
  id: number;
  name: string;
  isSelected: boolean;
}

const StatementListingPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);
  const [busList, setBusList] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<number | null>(null);
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>(
    []
  );
  const [_dutyList, setDutyList] = useState<Duty[]>([]);
  const [_operatorList, setOperatorList] = useState<Account[]>([]);
  const [statementData, setStatementData] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "statement">(
    "services"
  );
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [page, setPage] = useState(0);
  const [_hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const [isOperatorWise, setIsOperatorWise] = useState(false);

  // *************************Format date to UTC************************
  const formatDateToUTC = (dateString: string, isEndDate: boolean = false) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    if (isEndDate) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date.toISOString();
  };
  // Fetch bus list
  const fetchBusList = async () => {
    try {
      setIsLoading(true);
      const res = await dispatch(
        companyBusListApi({
          limit: 100,
          offset: 0,
        })
      ).unwrap();

      const formattedBuses =
        res?.data?.map((bus: any) => ({
          id: bus.id,
          name: bus.name,
          registrationNumber: bus.registration_number || "",
        })) || [];

      setBusList(formattedBuses);
    } catch (error: any) {
      console.error("Error fetching bus list", error);
      showErrorToast(error.message || "Failed to fetch bus list");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchBusList();
  }, [dispatch]);

  // Fetch services when a bus is selected or dates change
  const fetchServices = useCallback(async () => {
    if (!selectedBus) return;
    try {
      setIsLoading(true);
      let allServices: Service[] = [];
      let offset = 0;
      let hasMore = true;

      // Fetch ALL services in a loop
      while (hasMore) {
        const res = await dispatch(
          serviceListingApi({
            limit: rowsPerPage,
            offset,
            bus_id: selectedBus,
            starting_at_ge: fromDate ? formatDateToUTC(fromDate) : undefined,
            starting_at_le: toDate ? formatDateToUTC(toDate, true) : undefined,
            order_by: 3,
            order_in: 2,
          })
        ).unwrap();

        const items = res?.data || [];
        const formatted = items.map((service: any) => ({
          id: service.id,
          name: service.name || "",
          routeName: service.route?.name || "",
          status:
            service.status === 1
              ? "Created"
              : service.status === 2
              ? "Started"
              : service.status === 3
              ? "Terminated"
              : service.status === 4
              ? "Ended"
              : service.status === 5
              ? "Audited"
              : "",
          starting_at: service.starting_at || "",
          ending_at: service.ending_at || "",
        }));

        allServices = [...allServices, ...formatted];
        hasMore = items.length === rowsPerPage;
        offset += rowsPerPage;
      }

      // 🔥 GLOBAL sort by status
      const statusOrder: Record<string, number> = {
        Terminated: 1,
        Ended: 2,
        Started: 3,
        Created: 4,
        Audited: 5,
      };
      allServices.sort(
        (a, b) => (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99)
      );

      setServiceList(allServices);
      setHasNextPage(false); // Local pagination handles this now
      setSelectedServices(
        allServices.map((service) => ({
          id: service.id,
          name: service.name,
          isSelected: false,
        }))
      );
    } catch (error: any) {
      console.error("Error fetching services", error);
      showErrorToast(error.message || "Failed to fetch services");
      setServiceList([]);
      setSelectedServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedBus, fromDate, toDate, dispatch]);
  useEffect(() => {
    fetchServices();
  }, [fetchServices, page]);
  const handleChangePage = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  // Handle bus selection change
  const handleBusChange = (event: SelectChangeEvent<number>) => {
    const busId = event.target.value as number;
    setSelectedBus(busId);
    setActiveTab("services");
    setStatementData([]);
  };

  // Handle date changes
  const handleFromDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  const handleToDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(event.target.value);
    setPage(0); // Reset to first page when filter changes
  };

  // Handle service selection
  const handleServiceSelection = (serviceId: number) => {
    setSelectedServices((prev) =>
      prev.map((service) =>
        service.id === serviceId
          ? { ...service, isSelected: !service.isSelected }
          : service
      )
    );
  };

  // Select all services
  const handleSelectAll = () => {
    const allSelected = selectedServices.every((service) => service.isSelected);
    setSelectedServices((prev) =>
      prev.map((service) => ({ ...service, isSelected: !allSelected }))
    );
  };

  // *********************************************Generate statement***********************************
  const generateStatement = async () => {
    const selectedServiceIds = selectedServices
      .filter((service) => service.isSelected)
      .map((service) => service.id);

    if (selectedServiceIds.length === 0) {
      showErrorToast("Please select at least one service");
      return;
    }

    try {
      setIsGeneratingStatement(true);

      // Single API call with all service IDs
      const dutyRes = await dispatch(
        dutyListingApi({
          service_id_list: selectedServiceIds, // Pass array of service IDs
        })
      ).unwrap();

      const allDuties = dutyRes?.data || [];
      setDutyList(allDuties);

      // Extract unique operator IDs from duties
      const operatorIds = [
        ...new Set(allDuties.map((duty: any) => duty.operator_id)),
      ];

      // Fetch operator details for all unique operator IDs
      const operatorDetails = await Promise.all(
        operatorIds.map(async (id: unknown) => {
          const operatorId = id as number;
          try {
            const operatorRes = await dispatch(
              operatorListApi({
                id: operatorId.toString(),
                limit: 100,
                offset: 0,
              })
            ).unwrap();
            return Array.isArray(operatorRes?.data) &&
              operatorRes.data.length > 0
              ? operatorRes.data[0]
              : null;
          } catch (error) {
            console.error(`Error fetching operator ${operatorId}`, error);
            return null;
          }
        })
      );

      // Filter out any null values
      const validOperators = operatorDetails.filter((op) => op !== null);
      setOperatorList(validOperators);

      // Combine duty and operator data
      const statement = allDuties.map((duty: any) => {
        const operator = validOperators.find(
          (op) => op.id === duty.operator_id
        );
        return {
          dutyId: duty.id,
          collection: duty.collection,
          operatorId: duty.operator_id,
          operatorName: operator?.full_name || "Unknown",
          serviceId: duty.service_id,
          date: duty.date || new Date().toISOString().split("T")[0],
        };
      });

      setStatementData(statement);
      setActiveTab("statement");
      showSuccessToast("Statement generated successfully");
    } catch (error: any) {
      console.error("Error generating statement", error);
      showErrorToast(error.message || "Failed to generate statement");
    } finally {
      setIsGeneratingStatement(false);
    }
  };
  // ******************************************Calculate total collection******************************
  const totalCollection = statementData.reduce(
    (sum, item) => sum + (item.collection || 0),
    0
  );

  const operatorTotals = statementData.reduce(
    (acc: Record<number, { name: string; total: number }>, item) => {
      if (!acc[item.operatorId]) {
        acc[item.operatorId] = { name: item.operatorName, total: 0 };
      }
      acc[item.operatorId].total += item.collection || 0;
      return acc;
    },
    {}
  );
  const operatorTotalsArray = Object.values(operatorTotals);

  return (
    <Box
      sx={{ p: 3, display: "flex", flexDirection: "column", height: "100vh" }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="bus-select-label">Select Bus</InputLabel>
            <Select
              labelId="bus-select-label"
              value={selectedBus || ""}
              label="Select Bus"
              onChange={handleBusChange}
              disabled={isLoading}
            >
              {busList.map((bus) => (
                <MenuItem key={bus.id} value={bus.id}>
                  {bus.name} ({bus.registrationNumber})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => fetchServices()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </Stack>

        {/* Date range filters */}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <TextField
            sx={{ minWidth: 150 }}
            label="From "
            type="date"
            value={fromDate}
            onChange={handleFromDateChange}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            sx={{ minWidth: 150 }}
            label="To "
            type="date"
            value={toDate}
            onChange={handleToDateChange}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Stack>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {selectedBus && (
        <>
          <Box
            display="flex"
            justifyContent="space-between"
            gap={2}
            sx={{ borderColor: "divider", mb: 2 }}
          >
            <Box>
              <Button
                variant={activeTab === "services" ? "contained" : "outlined"}
                sx={{ mr: 1 }}
                onClick={() => setActiveTab("services")}
              >
                Services
              </Button>
              <Button
                sx={{ ml: 1 }}
                variant={activeTab === "statement" ? "contained" : "outlined"}
                disabled={statementData.length === 0}
                onClick={() => setActiveTab("statement")}
              >
                Statement
              </Button>
            </Box>

            {activeTab === "services" &&
              selectedServices.filter((s) => s.isSelected).length > 0 && (
                <Button
                  variant="contained"
                  onClick={generateStatement}
                  disabled={isGeneratingStatement}
                  sx={{ backgroundColor: "darkblue", color: "white" }}
                  startIcon={
                    isGeneratingStatement ? (
                      <CircularProgress size={20} />
                    ) : null
                  }
                >
                  Generate Statement
                </Button>
              )}
          </Box>
          {activeTab === "services" ? (
            /* Services Table with fixed pagination */
            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
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
                      <TableCell
                        padding="checkbox"
                        sx={{
                          backgroundColor: "#fafafa",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        <Checkbox
                          indeterminate={
                            selectedServices.some(
                              (service) => service.isSelected
                            ) &&
                            !selectedServices.every(
                              (service) => service.isSelected
                            )
                          }
                          checked={selectedServices.every(
                            (service) => service.isSelected
                          )}
                          onChange={handleSelectAll}
                          disabled={
                            !serviceList.some(
                              (service) =>
                                service.status === "Terminated" ||
                                service.status === "Ended"
                            )
                          }
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: "#fafafa",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        Service Name
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: "#fafafa",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        Route
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: "#fafafa",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          borderBottom: "1px solid #ddd",
                        }}
                      >
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center"></TableCell>
                      </TableRow>
                    ) : (
                      serviceList
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((service) => {
                          const isSelected =
                            selectedServices.find((s) => s.id === service.id)
                              ?.isSelected || false;

                          const canSelect =
                            service.status === "Terminated" ||
                            service.status === "Ended";
                          const cannotSelectTooltip =
                            "Cannot generate statement for services in Started or Created state";

                          return (
                            <TableRow
                              key={service.id}
                              hover
                              sx={{ cursor: canSelect ? "pointer" : "default" }}
                              onClick={() =>
                                canSelect && handleServiceSelection(service.id)
                              }
                            >
                              <TableCell padding="checkbox">
                                {canSelect ? (
                                  <Checkbox
                                    checked={isSelected}
                                    onChange={() =>
                                      handleServiceSelection(service.id)
                                    }
                                  />
                                ) : (
                                  <Tooltip title={cannotSelectTooltip} arrow>
                                    <span>
                                      <Checkbox
                                        checked={false}
                                        disabled
                                        sx={{ opacity: 0.5 }}
                                      />
                                    </span>
                                  </Tooltip>
                                )}
                              </TableCell>
                              <TableCell>{service.name}</TableCell>
                              <TableCell>{service.routeName}</TableCell>
                              <TableCell>
                                <Chip
                                  label={service.status}
                                  size="small"
                                  sx={{
                                    width: 100,
                                    backgroundColor:
                                      service.status === "Created"
                                        ? "rgba(33, 150, 243, 0.12)"
                                        : service.status === "Started"
                                        ? "rgba(76, 175, 80, 0.12)"
                                        : service.status === "Terminated"
                                        ? "rgba(244, 67, 54, 0.12)"
                                        : "rgba(158, 158, 158, 0.12)",
                                    color:
                                      service.status === "Created"
                                        ? "#1976D2"
                                        : service.status === "Started"
                                        ? "#388E3C"
                                        : service.status === "Terminated"
                                        ? "#D32F2F"
                                        : "#616161",
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                    borderRadius: "8px",
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
                {serviceList.length === 0 && !isLoading && (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="textSecondary">
                      No services found for the selected bus or date range.
                    </Typography>
                  </Box>
                )}
              </TableContainer>

              {/* Fixed Pagination at bottom */}
              <Box
                sx={{ p: 2, borderTop: 1, borderColor: "divider", mt: "auto" }}
              >
                <PaginationControls
                  page={page}
                  onPageChange={(newPage) => handleChangePage(null, newPage)}
                  isLoading={isLoading}
                  hasNextPage={(page + 1) * rowsPerPage < serviceList.length}
                />
              </Box>
            </Box>
          ) : (
            <Card sx={{ p: 3, position: "relative" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Alert severity="info" sx={{ mb: 0, flex: 1 }}>
                  Total Collection:{" "}
                  <strong>₹{totalCollection.toFixed(2)}</strong>
                </Alert>
                <Button
                  variant="contained"
                  onClick={() => setIsOperatorWise((prev) => !prev)}
                  sx={{ ml: 2, backgroundColor: "darkblue" }}
                >
                  {isOperatorWise ? "Duty wise" : "Operator wise"}
                </Button>
              </Box>

              {isOperatorWise ? (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <TableContainer component={Paper} sx={{ maxWidth: 400 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell
                            sx={{ fontWeight: "bold", textAlign: "center" }}
                          >
                            Operator
                          </TableCell>
                          <TableCell
                            sx={{ fontWeight: "bold", textAlign: "center" }}
                          >
                            Total Collection (₹)
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {operatorTotalsArray.map((op) => (
                          <TableRow key={op.name}>
                            <TableCell sx={{ textAlign: "center" }}>
                              {op.name}
                            </TableCell>
                            <TableCell sx={{ textAlign: "center" }}>
                              {op.total.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ) : (
                <TableContainer
                  sx={{
                    flex: 1,
                    maxHeight: "400px", // Set a fixed height for scroll
                    overflowY: "auto",
                    borderRadius: 2,
                    border: "1px solid #e0e0e0",
                    position: "relative",
                  }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#fafafa",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            borderBottom: "1px solid #ddd",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <b>Operator Name</b>
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#fafafa",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            borderBottom: "1px solid #ddd",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <b>Service ID</b>
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#fafafa",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            borderBottom: "1px solid #ddd",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <b>Duty ID</b>
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#fafafa",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            borderBottom: "1px solid #ddd",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <b>Date</b>
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "center",
                            backgroundColor: "#fafafa",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            borderBottom: "1px solid #ddd",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                          align="right"
                        >
                          <b>Collection (₹)</b>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {statementData.map((item) => (
                        <TableRow key={item.dutyId}>
                          <TableCell sx={{ textAlign: "center" }}>
                            {item.operatorName}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            {item.serviceId}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            {item.dutyId}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            {item.date}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }} align="right">
                            {item.collection?.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {statementData.length === 0 && (
                <Box sx={{ p: 3, textAlign: "center" }}>
                  <Typography variant="body1" color="textSecondary">
                    No statement data available.
                  </Typography>
                </Box>
              )}
            </Card>
          )}
        </>
      )}
      {/*************************************************************when no bus is selected*************************************/}
      {!selectedBus && (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            p: 3,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <img
              src={nodataimage}
              alt="No data"
              style={{ width: 120, height: 120, opacity: 0.7 }}
            />
          </Box>
          <Typography variant="h6" gutterBottom>
            No Statement Available
          </Typography>
          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ maxWidth: 400 }}
          >
            Please select a bus and date range to generate a statement. Once you
            do, the report will be displayed here.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StatementListingPage;
