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
  AppBar,
  Toolbar,
  IconButton,
  OutlinedInput,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
import CloseIcon from "@mui/icons-material/Close";
interface SelectedService {
  id: number;
  name: string;
  isSelected: boolean;
}

interface StatementListProps {
  onStatementGenerated: () => void;
  onBackToServices?: () => void;
}
const StatementListingPage = ({
  onStatementGenerated,
  onBackToServices,
}: StatementListProps) => {
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
  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const [fromDate, setFromDate] = useState<string>(getToday());
  const [toDate, setToDate] = useState<string>(getToday());
  const [page, setPage] = useState(0);
  const [_hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const [isOperatorWise, setIsOperatorWise] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  // Fetch services when bus or dates change
  const fetchServices = useCallback(async () => {
    try {
      setIsLoading(true);
      let allServices: Service[] = [];
      let offset = 0;
      let hasMore = true;

      // Fetch ALL services (with or without bus filter)
      while (hasMore) {
        const res = await dispatch(
          serviceListingApi({
            limit: rowsPerPage,
            offset,
            // 👇 only include bus_id if selected
            bus_id: selectedBus || undefined,
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

      // 🔥 Sort by status
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
      setHasNextPage(false);
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
          status_list: [3, 4], // Only fetch Terminated and Ended duties
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
          serviceName:
            serviceList.find((s) => s.id === duty.service_id)?.name || "",
          routeName:
            serviceList.find((s) => s.id === duty.service_id)?.routeName || "",
          date: duty.date || new Date().toISOString().split("T")[0],
        };
      });
      console.log("Generated statement......:", statement);

      setStatementData(statement);
      setActiveTab("statement");
      setIsFullScreen(true); // Set full screen mode
      showSuccessToast("Statement generated successfully");
      onStatementGenerated();
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

  const serviceWiseTotals = statementData.reduce(
    (
      acc: Record<
        number,
        {
          serviceName: string;
          routeName: string;
          date: string;
          total: number;
        }
      >,
      item
    ) => {
      if (!acc[item.serviceId]) {
        acc[item.serviceId] = {
          serviceName: item.serviceName,
          routeName: item.routeName,
          date: item.date,
          total: 0,
        };
      }
      acc[item.serviceId].total += item.collection || 0;
      return acc;
    },
    {}
  );
  const serviceWiseArray = Object.values(serviceWiseTotals);

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    if (activeTab === "statement" && onBackToServices) {
      setActiveTab("services");
      setIsFullScreen(false);
      onBackToServices();
    }
  };

  // Print styles
  const printStyles = `
    @media print {
      body * {
        visibility: hidden;
      }
      #statement-print-section, #statement-print-section * {
        visibility: visible;
      }
      #statement-print-section {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
      }
      .no-print {
        display: none !important;
      }
    }
  `;

  return (
    <>
      <style>{printStyles}</style>
      <Box
        sx={{
          mt: { xs: 4, sm: 0 },
          p: isFullScreen ? 0 : { xs: 1.5, sm: 2, md: 3 },
          display: "flex",
          flexDirection: "column",
          height: isFullScreen ? "100vh" : "100vh",
          minHeight: 0,
          gap: 2,
          position: isFullScreen ? "fixed" : "relative",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: isFullScreen ? 1300 : 1,
          backgroundColor: "white",
          overflow: isFullScreen ? "auto" : "visible",
        }}
        id="statement-print-section"
      >
        {isFullScreen && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{ backgroundColor: "white", color: "black" }}
            className="no-print"
          >
            <Toolbar>
              <IconButton
                edge="start"
                color="inherit"
                onClick={handleBack}
                aria-label="back"
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Statement
              </Typography>
            </Toolbar>
          </AppBar>
        )}

        {!(activeTab === "statement") && (
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            className={isFullScreen ? "no-print" : ""}
          >
            {/* Bus select + refresh */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
              flex={1}
            >
              <FormControl size="small" fullWidth>
                <InputLabel id="bus-select-label">Select Bus</InputLabel>
                <Select
                  labelId="bus-select-label"
                  value={selectedBus || ""}
                  onChange={handleBusChange}
                  IconComponent={() => null}
                  input={
                    <OutlinedInput
                      label="Select Bus"
                      endAdornment={
                        selectedBus ? (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation(); // prevent dropdown opening
                              setSelectedBus(null);
                            }}
                            edge="end"
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        ) : null
                      }
                    />
                  }
                >
                  {busList.length > 0 ? (
                    busList.map((bus) => (
                      <MenuItem key={bus.id} value={bus.id}>
                        {bus.name} ({bus.registrationNumber})
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No buses available</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Stack>

            {/* Date range filters */}
            <Stack
              direction="row"
              spacing={1}
              flex={1}
              justifyContent="flex-end"
              sx={{ mt: { xs: 2, sm: 0 } }}
            >
              <TextField
                fullWidth
                size="small"
                label="From"
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                size="small"
                label="To"
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <Button
              variant="outlined"
              onClick={() => fetchServices()}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </Stack>
        )}
        {!(activeTab === "statement") && (
          <Divider sx={{ my: 2 }} className={isFullScreen ? "no-print" : ""} />
        )}

        <>
          <Box
            display="flex"
            flexDirection={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            gap={2}
            className={isFullScreen ? "no-print" : ""}
          >
            <Stack direction="row" spacing={1}>
              {activeTab === "statement" && !isFullScreen && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setActiveTab("services")}
                >
                  Back
                </Button>
              )}
            </Stack>
            {activeTab === "services" &&
              selectedServices.filter((s) => s.isSelected).length > 0 && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={generateStatement}
                  disabled={isGeneratingStatement}
                  sx={{
                    backgroundColor: "darkblue",
                    color: "white",
                    alignSelf: { xs: "stretch", sm: "center" },
                  }}
                  startIcon={
                    isGeneratingStatement ? (
                      <CircularProgress size={18} />
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
              className={isFullScreen ? "no-print" : ""}
            >
              <TableContainer
                sx={{
                  flex: 1,
                  maxHeight: { xs: "60vh", md: "calc(100vh - 200px)" },
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
                      inset: 0,
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
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        padding="checkbox"
                        sx={{
                          backgroundColor: "#fafafa",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          borderBottom: "1px solid #ddd",
                          width: 60,
                          textAlign: "center", // <-- Add this
                          p: 0, // <-- Remove default padding
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
                          sx={{ m: 0 }} // <-- Remove margin
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          backgroundColor: "#fafafa",
                          fontWeight: 600,
                          fontSize: "0.875rem",
                          borderBottom: "1px solid #ddd",
                          minWidth: 160,
                          width: 180,
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
                          minWidth: 100,
                          width: 140,
                          // pl: 2, // <-- Remove this for better alignment
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
                          width: 110,
                          textAlign: "center",
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

                          const rowContent = (
                            <>
                              <TableCell
                                padding="checkbox"
                                sx={{ textAlign: "center", width: 60, p: 0 }} // <-- Match header
                              >
                                <Checkbox
                                  checked={canSelect ? isSelected : false}
                                  onChange={() =>
                                    canSelect &&
                                    handleServiceSelection(service.id)
                                  }
                                  disabled={!canSelect}
                                  sx={{ opacity: canSelect ? 1 : 0.5, m: 0 }} // <-- Remove margin
                                />
                              </TableCell>
                              <TableCell
                                align="left"
                                sx={{
                                  minWidth: 160,
                                  width: 180,
                                  fontWeight: 500,
                                }}
                              >
                                {service.name}
                              </TableCell>
                              <TableCell
                                align="left"
                                sx={{ minWidth: 100, width: 140 }}
                              >
                                {service.routeName}
                              </TableCell>
                              <TableCell align="center" sx={{ width: 110 }}>
                                <Chip
                                  label={service.status}
                                  size="small"
                                  sx={{
                                    width: 90,
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
                            </>
                          );

                          return canSelect ? (
                            <TableRow
                              key={service.id}
                              hover
                              sx={{ cursor: "pointer" }}
                              onClick={() => handleServiceSelection(service.id)}
                            >
                              {rowContent}
                            </TableRow>
                          ) : (
                            <Tooltip
                              title={cannotSelectTooltip}
                              arrow
                              placement="top"
                            >
                              <TableRow
                                key={service.id}
                                sx={{
                                  cursor: "not-allowed",
                                  backgroundColor: "#f9f9f9",
                                  "&:hover": { backgroundColor: "#f0f0f0" },
                                }}
                              >
                                {rowContent}
                              </TableRow>
                            </Tooltip>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
                {serviceList.length === 0 && !isLoading && (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography variant="body1" color="textSecondary">
                      No services found for the selected date range.
                    </Typography>
                  </Box>
                )}
              </TableContainer>

              {/* Fixed Pagination at bottom */}
              <Box sx={{ p: 1.5, borderTop: 1, borderColor: "divider" }}>
                <PaginationControls
                  page={page}
                  onPageChange={(newPage) => handleChangePage(null, newPage)}
                  isLoading={isLoading}
                  hasNextPage={(page + 1) * rowsPerPage < serviceList.length}
                />
              </Box>
            </Box>
          ) : (
            <Card sx={{ p: 2 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
                mb={2}
              >
                <Alert severity="info" sx={{ flex: 1 }}>
                  Total Collection:{" "}
                  <strong>₹{totalCollection.toFixed(2)}</strong>
                </Alert>
                <Button
                  variant="contained"
                  onClick={() => setIsOperatorWise((prev) => !prev)}
                  sx={{ backgroundColor: "darkblue" }}
                  size="small"
                  className="no-print"
                >
                  {isOperatorWise ? "Service wise" : "Operator wise"}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={handlePrint}
                  sx={{ backgroundColor: "#9bc1e721" }}
                  size="small"
                  className="no-print"
                >
                  Print
                </Button>
              </Stack>

              {isOperatorWise ? (
                <Box sx={{ display: "flex", justifyContent: "center" }}>
                  <TableContainer
                    component={Paper}
                    sx={{ maxWidth: 400, }}
                  >
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
                              <b>
                                {op.total !== null &&
                                op.total !== undefined &&
                                !isNaN(op.total)
                                  ? op.total.toFixed(2)
                                  : "Duty Not Finished"}
                              </b>
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
                            textAlign: "left",
                            backgroundColor: "#fafafa",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            borderBottom: "1px solid #ddd",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <b>Service name</b>
                        </TableCell>
                        <TableCell
                          sx={{
                            textAlign: "left",
                            backgroundColor: "#fafafa",
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            borderBottom: "1px solid #ddd",
                            position: "sticky",
                            top: 0,
                            zIndex: 2,
                          }}
                        >
                          <b>Route Name</b>
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
                      {serviceWiseArray.map((service, idx) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ textAlign: "left" }}>
                            {service.serviceName}
                          </TableCell>

                          <TableCell sx={{ textAlign: "left" }}>
                            {service.routeName}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            {service.date}
                          </TableCell>
                          <TableCell sx={{ textAlign: "center" }}>
                            <b>{service.total.toFixed(2)}</b>
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
                    No statement data available. Make sure the Duties are finished 
                  </Typography>
                </Box>
              )}
            </Card>
          )}
        </>
      </Box>
    </>
  );
};

export default StatementListingPage;
