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
import {
  dutyListingApi,
  operatorListApi,
  serviceListingApi,
} from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { RootState } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import PaginationControls from "../../common/paginationControl";
import FormModal from "../../common/formModal";
import DutyCreationForm from "./dutyCreationForm";
import { Duty } from "../../types/type";
import DutyDetailsCard from "./DetailPage";

const getStatusBackendValue = (displayValue: string): string => {
  const statusMap: Record<string, string> = {
    Assigned: "1",
    Started: "2",
    Terminated: "3",
    Finished: "4",
  };
  return statusMap[displayValue] || "";
};

const getTypeModeBackendValue = (displayValue: string): string => {
  const TypeModMap: Record<string, string> = {
    Driver: "1",
    Conductor: "2",
    Kili: "3",
    Other: "4",
  };
  return TypeModMap[displayValue] || "";
};

const DutyListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [dutyList, setDutyList] = useState<Duty[]>([]);
  const [selectedDuty, setSelectedDuty] = useState<Duty | null>(null);
  const [search, setSearch] = useState({
    id: "",
    status: "",
    type: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canManageDuty = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_duty")
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const fetchDutyList = useCallback(
    async (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;

      try {
        const dutyResponse = await dispatch(
          dutyListingApi({ limit: rowsPerPage, offset, ...searchParams })
        ).unwrap();

        const items = dutyResponse.data || [];

        // Fetch details for each duty in parallel
        const dutiesWithDetails = await Promise.all(
          items.map(async (duty: any) => {
            try {
              const [operatorResponse, serviceResponse] = await Promise.all([
                dispatch(
                  operatorListApi({ limit: 1, offset: 0, id: duty.operator_id })
                ).unwrap(),
                dispatch(
                  serviceListingApi({
                    limit: 1,
                    offset: 0,
                    id: duty.service_id,
                  })
                ).unwrap(),
              ]);

              const operator = operatorResponse.data.find(
                (operator: any) => operator.id === duty.operator_id
              );
              const service = serviceResponse.data.find(
                (service: any) => service.id === duty.service_id
              );

              return {
                id: duty.id,
                name: duty.name,
                service_id: duty.service_id,
                serviceName: service?.name || `Service ${duty.service_id}`,
                operator_id: duty.operator_id,
                operatorName:
                  operator?.full_name || `Operator ${duty.operator_id}`,
                status:
                  duty.status === 1
                    ? "Assigned"
                    : duty.status === 2
                    ? "Started"
                    : duty.status === 3
                    ? "Terminated"
                    : "Finished",
                type:
                  duty.type === 1
                    ? "Driver"
                    : duty.type === 2
                    ? "Conductor"
                    : duty.type === 3
                    ? "Kili"
                    : "Other",
              };
            } catch (error) {
              console.error(
                `Error fetching details for duty ${duty.id}:`,
                error
              );
              return {
                ...duty,
                serviceName: `Service ${duty.service_id}`,
                operatorName: `Operator ${duty.operator_id}`,
                status: "Unknown",
                type: "Unknown",
              };
            }
          })
        );

        setDutyList(dutiesWithDetails);
        setHasNextPage(items.length === rowsPerPage);
      } catch (error: any) {
        console.error("Fetch Error:", error);
        showErrorToast(error.message || "Failed to fetch Duty list");
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

  const handleRowClick = (duty: Duty) => {
    setSelectedDuty(duty);
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
    const statusBackendValue = getStatusBackendValue(debouncedSearch.status);
    const typeModeBackendValue = getTypeModeBackendValue(debouncedSearch.type);
    const searchParams: any = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(statusBackendValue && { status: statusBackendValue }),
      ...(typeModeBackendValue && { type: typeModeBackendValue }),
    };

    fetchDutyList(page, searchParams);
  }, [page, debouncedSearch, fetchDutyList]);
  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchDutyList(page, debouncedSearch);
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
          flex: selectedDuty ? { xs: "0 0 100%", md: "0 0 65%" } : "0 0 100%",
          maxWidth: selectedDuty ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tooltip
          title={
            !canManageDuty
              ? "You don't have permission, contact the admin"
              : "Click to open the Bus creation form"
          }
          placement="top-end"
        >
          <Button
            sx={{
              ml: "auto",
              mr: 2,
              mb: 2,
              backgroundColor: !canManageDuty
                ? "#6c87b7 !important"
                : "#00008B",
              color: "white",
              display: "flex",
              justifyContent: "flex-end",
            }}
            variant="contained"
            onClick={() => setOpenCreateModal(true)}
            disabled={!canManageDuty}
            style={{ cursor: !canManageDuty ? "not-allowed" : "pointer" }}
          >
            Add New Duty
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
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                {[
                  { label: "ID", width: "80px" },
                  { label: "Type", width: "120px" },
                  { label: "Status", width: "120px" },
                  { label: "Operator", width: "200px" },
                  { label: "Service", width: "200px" },
                ].map((col, _index) => (
                  <TableCell
                    key={col.label}
                    sx={{
                      width: col.width,
                      minWidth: col.width,
                      textAlign: "center",
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
                <TableCell>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.id}
                    onChange={(e) => handleSearchChange(e, "id")}
                    fullWidth
                    type="number"
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={search.type}
                    onChange={(e) => handleSelectChange(e, "type")}
                    displayEmpty
                    size="small"
                    fullWidth
                    sx={{ height: 40 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Driver">Driver</MenuItem>
                    <MenuItem value="Conductor">Conductor</MenuItem>
                    <MenuItem value="Kili">Kili</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={search.status}
                    onChange={(e) => handleSelectChange(e, "status")}
                    displayEmpty
                    size="small"
                    fullWidth
                    sx={{ height: 40 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Assigned">Assigned</MenuItem>
                    <MenuItem value="Started">Started</MenuItem>
                    <MenuItem value="Terminated">Terminated</MenuItem>
                    <MenuItem value="Finished">Finished</MenuItem>
                  </Select>
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableHead>

            <TableBody>
              {dutyList.length > 0 ? (
                dutyList.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => handleRowClick(row)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedDuty?.id === row.id ? "#E3F2FD" : "inherit",
                      "&:hover": { backgroundColor: "#E3F2FD" },
                    }}
                  >
                    <TableCell sx={{ textAlign: "center" }}>{row.id}</TableCell>
                    <TableCell>
                      <Chip
                        label={row.type}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            row.type === "Driver"
                              ? "rgba(76, 175, 80, 0.12)"
                              : row.type === "Conductor"
                              ? "rgba(33, 150, 243, 0.12)"
                              : row.type === "Kili"
                              ? "rgba(255, 152, 0, 0.15)"
                              : "rgba(189, 189, 189, 0.12)",
                          color:
                            row.type === "Driver"
                              ? "#388E3C"
                              : row.type === "Conductor"
                              ? "#1976D2"
                              : row.type === "Kili"
                              ? "#FF9800"
                              : "#616161",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={row.status}
                        size="small"
                        sx={{
                          width: 100,
                          textAlign: "center",
                          backgroundColor:
                            row.status === "Assigned"
                              ? "rgba(33, 150, 243, 0.12)"
                              : row.status === "Started"
                              ? "rgba(76, 175, 80, 0.12)"
                              : row.status === "Terminated"
                              ? "rgba(244, 67, 54, 0.12)"
                              : "rgba(158, 158, 158, 0.12)",
                          color:
                            row.status === "Assigned"
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
                      <Typography noWrap>{row.operatorName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography noWrap>{row.serviceName}</Typography>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No Duty found.
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
      {selectedDuty && (
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
          <DutyDetailsCard
            duty={selectedDuty}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedDuty(null)}
            refreshList={(value: any) => refreshList(value)}
            canManageDuty={canManageDuty}
            onCloseDetailCard={() => setSelectedDuty(null)}
          />
        </Box>
      )}

      {/* Create Account Modal */}
      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Create Duty"
      >
        <DutyCreationForm
          refreshList={refreshList}
          onClose={() => setOpenCreateModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default DutyListingTable;
