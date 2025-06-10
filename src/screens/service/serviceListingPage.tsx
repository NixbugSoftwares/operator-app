import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  FormControl,
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

const ServiceListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [serviceList, setServiceBusList] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [search, setSearch] = useState({
    id: "",
    name: "",
    ticket_mode: "",
    status: "",
    created_mode: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
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
    (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        serviceListingApi({ limit: rowsPerPage, offset, ...searchParams })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          console.log("items", items);
          const formattedBusses = items.map((service: any) => ({
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
          setServiceBusList(formattedBusses);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error) => {
          console.error("Fetch Error:", error);
          showErrorToast(error.message || "Failed to fetch Bus list");
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
      column: keyof typeof search
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
    (e: SelectChangeEvent<string>, column: keyof typeof search) => {
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
    const ticketModeBackendValue = getTicketModeBackendValue(
      debouncedSearch.ticket_mode
    );
    const statusBackendValue = getStatusBackendValue(debouncedSearch.status);
    const createdModeBackendValue = getCreatedModeBackendValue(
      debouncedSearch.created_mode
    );
    const searchParams: any = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(debouncedSearch.name && { name: debouncedSearch.name }),
      ...(ticketModeBackendValue && { ticket_mode: ticketModeBackendValue }),
      ...(statusBackendValue && { status: statusBackendValue }),
      ...(createdModeBackendValue && { created_mode: createdModeBackendValue }),
    };

    fetchServiceList(page, searchParams);
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
              : "Click to open the Bus creation form"
          }
          placement="top-end"
        >
          <span style={{ cursor: !canManageService ? "not-allowed" : "pointer" }}>
            <Button
              sx={{
                ml: "auto",
                mr: 2,
                mb: 2,
                backgroundColor: !canManageService
                  ? "#6c87b7 !important"
                  : "#00008B",
                color: "white",
                display: 'flex', justifyContent: 'flex-end'
              }}
              variant="contained"
              onClick={() => setOpenCreateModal(true)}
              disabled={!canManageService}
            >
              Add New Service
            </Button>
          </span>
        </Tooltip>

        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                {["ID", "Name", "Ticket Mode", "Status", "Created Mode"].map(
                  (label, index) => {
                    const key = [
                      "id",
                      "name",
                      "ticket_mode",
                      "status",
                      "created_mode",
                    ][index] as keyof typeof search;

                    const isNumberField = key === "id";
                    const isSelectField =
                      key === "ticket_mode" ||
                      key === "status" ||
                      key === "created_mode";

                    const selectOptions =
                      key === "ticket_mode"
                        ? ["Hybrid", "Digital", "Conventional"]
                        : key === "status"
                        ? ["Created", "Started", "Terminated", "Ended"]
                        : key === "created_mode"
                        ? ["Manual", "Automatic"]
                        : [];

                    return (
                      <TableCell
                        key={label}
                        sx={{
                          width: key === "id" || key === "name" ? 200 : "auto",
                        }}
                      >
                        <b
                          style={{
                            display: "block",
                            textAlign: "center",
                            fontSize: selectedService ? "0.8rem" : "1rem",
                          }}
                        >
                          {label}
                        </b>

                        {isSelectField ? (
                          <FormControl fullWidth size="small">
                            <Select
                              value={search[key]}
                              onChange={(e) => handleSelectChange(e, key)}
                              displayEmpty
                              sx={{
                                height: 40,
                                fontSize: selectedService ? "0.8rem" : "1rem",
                                textAlign: "center",
                                "& .MuiSelect-select": {
                                  textAlign: "center",
                                },
                              }}
                            >
                              <MenuItem value="">All</MenuItem>
                              {selectOptions.map((option) => (
                                <MenuItem key={option} value={option}>
                                  {option}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <TextField
                            variant="outlined"
                            size="small"
                            placeholder="Search"
                            value={search[key]}
                            onChange={(e) => handleSearchChange(e, key)}
                            fullWidth
                            type={isNumberField ? "number" : "text"}
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
                    );
                  }
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {serviceList.length > 0 ? (
                serviceList.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => handleRowClick(row)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedService?.id === row.id
                            ? "#E3F2FD"
                            : "inherit",
                        "&:hover": {
                          backgroundColor: "#E3F2FD",
                        },
                      }}
                    >
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.ticket_mode}</TableCell>
                      <TableCell>{row.status}</TableCell>
                      <TableCell>{row.created_mode}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
      {/* Right Side - Account Details Card */}
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

      {/* Create Account Modal */}
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
