import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
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

type SearchFilter = {
  id: string;
  ticket_mode: string;
  status: string;
};

const ServiceListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState<SearchFilter>({
    id: "",
    ticket_mode: "",
    status: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState<SearchFilter>(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canCreateService = useSelector((state: RootState) =>
    state.app.permissions.includes("create_service")
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const fetchServiceList = useCallback(
    async (pageNumber: number, searchParams: Partial<SearchFilter> = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;

      const backendSearchParams = {
        ...searchParams,
        ticket_mode: searchParams.ticket_mode
          ? +getTicketModeBackendValue(searchParams.ticket_mode)
          : undefined,
        status: searchParams.status
          ? +getStatusBackendValue(searchParams.status)
          : undefined,
      };

      try {
        const res = await dispatch(
          serviceListingApi({
            limit: rowsPerPage,
            offset,
            ...backendSearchParams,
          })
        ).unwrap();

        const items = res?.data || [];
        console.log("API Response:", items);
        
        const formattedServices = items.map((service: any) => ({
          id: service.id,
          name: service.name ?? "",
          routeName: service.route?.name ?? "",
          fareName: service.fare?.name ?? "",
          ticket_mode:
            service.ticket_mode === 1
              ? "Hybrid"
              : service.ticket_mode === 2
              ? "Digital"
              : service.ticket_mode === 3
              ? "Conventional"
              : "",
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
          starting_at: service.starting_at ?? "",
          ending_at: service.ending_at ?? "",
          remarks: service.remark ?? "",
          created_on: service.created_on ?? "",
          updated_on: service.updated_on ?? "",
        }));
        console.log("Formatted Services:", formattedServices);
        

        setServiceList(formattedServices);
        setHasNextPage(items.length === rowsPerPage);
      } catch (error: any) {
        console.error("Fetch Error:", error);
        showErrorToast(error || "Failed to fetch Service list");
        setServiceList([]);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, rowsPerPage]
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

  const refreshList = useCallback((value: string) => {
    if (value === "refresh") {
      fetchServiceList(page, debouncedSearch);
    }
  }, [fetchServiceList, page, debouncedSearch]);

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
          flex: selectedService ? { xs: "0 0 100%", md: "0 0 65%" } : "0 0 100%",
          maxWidth: selectedService ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {canCreateService && (
          <Button
            sx={{
              ml: "auto",
              mr: 2,
              mb: 2,
              backgroundColor: "#00008B",
              color: "white",
              display: "flex",
              justifyContent: "flex-end",
              '&:disabled': {
                backgroundColor: "#6c87b7",
                cursor: "not-allowed",
              }
            }}
            variant="contained"
            onClick={() => setOpenCreateModal(true)}
            disabled={!canCreateService}
          >
            Add New Service
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
                  { label: "Status", width: 160, key: "status" },
                  { label: "Ticket Mode", width: 160, key: "ticket_mode" },
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
                          },
                          "& .MuiInputBase-input": {
                            textAlign: "center",
                          },
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
                            ) : serviceList.length > 0 ? (
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
                      <Tooltip title={row.name} placement="bottom">
                        <Typography noWrap>
                          {row.name.length > 15
                            ? `${row.name.substring(0, 15)}...`
                            : row.name}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          width: 100,
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
                    <TableCell align="center">
                      <Chip
                        label={row.ticket_mode}
                        size="small"
                        sx={{
                          width: 100,
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
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
            onBack={() => setSelectedService(null)}
            refreshList={refreshList}
            onCloseDetailCard={() => setSelectedService(null)}
            onUpdate={() => {}}
            onDelete={() => {}}
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
