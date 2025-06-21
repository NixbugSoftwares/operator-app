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
import { serviceListingApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { RootState } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import PaginationControls from "../../common/paginationControl";
import FormModal from "../../common/formModal";
import ServiceCreationForm from "./ServiceCreationForm";
import { Service } from "../../types/type";
import ServiceDetailsCard from "./serviceDetails";

// Utility functions for converting between display and backend values
const getTicketModeBackendValue = (displayValue: string): string => {
  const ticketMap: Record<string, string> = {
    Hybrid: "1",
    Digital: "2",
    Conventional: "3",
  };
  return ticketMap[displayValue] || "";
};

const getStatusBackendValue = (displayValue: string): string => {
  const statusMap: Record<string, string> = {
    Created: "1",
    Started: "2",
    Terminated: "3",
    Ended: "4",
  };
  return statusMap[displayValue] || "";
};

const getCreatedModeBackendValue = (displayValue: string): string => {
  const createdModMap: Record<string, string> = {
    Manual: "1",
    Automatic: "2",
  };
  return createdModMap[displayValue] || "";
};

// Define search filter types
type SearchFilter = {
  id: string;
  name: string;
  ticket_mode: string;
  status: string;
  created_mode: string;
};

const ServiceListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState<SearchFilter>({
    id: "",
    name: "",
    ticket_mode: "",
    status: "",
    created_mode: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState<SearchFilter>(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canManageService = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_service")
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
        status: searchParams.status
          ? +getStatusBackendValue(searchParams.status)
          : undefined,
        created_mode: searchParams.created_mode
          ? +getCreatedModeBackendValue(searchParams.created_mode)
          : undefined,
      };

      dispatch(
        serviceListingApi({
          limit: rowsPerPage,
          offset,
          ...backendSearchParams,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedServices = items.map((service: any) => ({
            id: service.id,
            name: service.name,
            route_id: service.route_id,
            fare_id: service.fare_id,
            bus_id: service.bus_id,
            ticket_mode:
              service.ticket_mode === 1
                ? "Hybrid"
                : service.ticket_mode === 2
                ? "Digital"
                : "Conventional",
            status:
              service.status === 1
                ? "Created"
                : service.status === 2
                ? "Started"
                : service.status === 3
                ? "Terminated"
                : "Ended",
            created_mode: service.created_mode === 1 ? "Manual" : "Automatic",
            starting_date: service.starting_date,
            remarks: service.remark,
          }));
          setServiceList(formattedServices);
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

  const handleRowClick = (service: Service) => {
    setSelectedService(service);
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
          flex: selectedService
            ? { xs: "0 0 100%", md: "0 0 65%" }
            : "0 0 100%",
          maxWidth: selectedService ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tooltip
          title={
            !canManageService
              ? "You don't have permission, contact the admin"
              : "Click to open the Service creation form"
          }
          placement="top-end"
        >
          <Button
            sx={{
              ml: "auto",
              mr: 2,
              mb: 2,
              backgroundColor: !canManageService
                ? "#6c87b7 !important"
                : "#00008B",
              color: "white",
              display: "flex",
              justifyContent: "flex-end",
            }}
            variant="contained"
            onClick={() => setOpenCreateModal(true)}
            disabled={!canManageService}
            style={{ cursor: !canManageService ? "not-allowed" : "pointer" }}
          >
            Add New Service
          </Button>
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
                  { label: "Status", width: 160, key: "status" },
                  { label: "Ticket Mode", width: 160, key: "ticket_mode" },
                  { label: "Created Mode", width: 160, key: "created_mode" },
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
                    key: "status",
                    isSelect: true,
                    options: ["Created", "Started", "Terminated", "Ended"],
                  },
                  {
                    key: "ticket_mode",
                    isSelect: true,
                    options: ["Hybrid", "Digital", "Conventional"],
                  },
                  
                  {
                    key: "created_mode",
                    isSelect: true,
                    options: ["Manual", "Automatic"],
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
                            fontSize: selectedService ? "0.8rem" : "1rem",
                          },
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                            fontSize: selectedService ? "0.8rem" : "1rem",
                          },
                        }}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {serviceList.length > 0 ? (
                serviceList.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => handleRowClick(row)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedService?.id === row.id ? "#E3F2FD" : "inherit",
                      "&:hover": { backgroundColor: "#E3F2FD" },
                    }}
                  >
                    <TableCell sx={{ textAlign: "center" }}>{row.id}</TableCell>
                    <TableCell>
                      <Typography noWrap>{row.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            row.status === "Created"
                              ? "rgba(33, 150, 243, 0.12)"
                              : row.status === "Started"
                              ? "rgba(76, 175, 80, 0.12)"
                              : row.status === "Terminated"
                              ? "rgba(244, 67, 54, 0.12)"
                              : "rgba(158, 158, 158, 0.12)",
                          color:
                            row.status === "Created"
                              ? "#1976D2"
                              : row.status === "Started"
                              ? "#388E3C"
                              : row.status === "Terminated"
                              ? "#D32F2F"
                              : "#616161",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.ticket_mode}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            row.ticket_mode === "Hybrid"
                              ? "rgba(0, 150, 136, 0.15)" 
                              : row.ticket_mode === "Digital"
                              ? "rgba(33, 150, 243, 0.15)" 
                              : "rgba(255, 87, 34, 0.15)", 
                          color:
                            row.ticket_mode === "Hybrid"
                              ? "#009688" 
                              : row.ticket_mode === "Digital"
                              ? "#2196F3" 
                              : "#FF5722", 
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                        }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={row.created_mode}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            row.created_mode === "Manual"
                              ? "rgba(255, 152, 0, 0.15)" 
                              : "rgba(63, 81, 181, 0.15)", 
                          color:
                            row.created_mode === "Manual"
                              ? "#FF9800" 
                              : "#3F51B5", 
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

      {selectedService && (
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
          <ServiceDetailsCard
            service={selectedService}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedService(null)}
            refreshList={(value: any) => refreshList(value)}
            canManageService={canManageService}
            onCloseDetailCard={() => setSelectedService(null)}
          />
        </Box>
      )}

      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
      >
        <ServiceCreationForm
          refreshList={refreshList}
          onClose={() => setOpenCreateModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default ServiceListingTable;
