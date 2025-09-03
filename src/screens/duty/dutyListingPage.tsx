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
    Ended: "4",
    Discarded: "5",
  };
  return statusMap[displayValue] || "";
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
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canCreateDuty = useSelector((state: RootState) =>
    state.app.permissions.includes("create_duty")
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);


const fetchDutyList = useCallback(
  async (pageNumber: number, searchParams = {}) => {
    setIsLoading(true);
    const offset = pageNumber * rowsPerPage;

    try {
      // Fetch duties
      const dutyResponse = await dispatch(
        dutyListingApi({
          limit: rowsPerPage,
          offset,
          ...searchParams,
        })
      ).unwrap();

      const duties: any[] = dutyResponse.data || [];

      // Convert IDs to string[] and ensure uniqueness
      const operatorIds: string[] = Array.from(
        new Set(duties.map((duty) => String(duty.operator_id)))
      );
      const serviceIds: string[] = Array.from(
        new Set(duties.map((duty) => String(duty.service_id)))
      );

      // Fetch operators and services in parallel (with dummy pagination)
      const [operatorResponse, serviceResponse] = await Promise.all([
        dispatch(
          operatorListApi({
            id_list: operatorIds,
          })
        ).unwrap(),
        dispatch(
          serviceListingApi({
            id_list: serviceIds,
          })
        ).unwrap(),
      ]);

      // Create lookup maps
      const operatorMap: Record<string, any> = {};
      operatorResponse.data.forEach((o: any) => {
        operatorMap[o.id] = o;
      });

      const serviceMap: Record<string, any> = {};
      serviceResponse.data.forEach((s: any) => {
        serviceMap[s.id] = s;
      });

      // Merge details into duties
      const dutiesWithDetails : any = duties.map((duty) => ({
        id: duty.id,
        name: duty.name,
        service_id: duty.service_id,
        serviceName:
          serviceMap[duty.service_id]?.name || `Service ${duty.service_id}`,
        operator_id: duty.operator_id,
        operatorName:
          operatorMap[duty.operator_id]?.full_name ||
          `Operator ${duty.operator_id}`,
        status:
          duty.status === 1
            ? "Assigned"
            : duty.status === 2
            ? "Started"
            : duty.status === 3
            ? "Terminated"
            : duty.status === 4
            ? "Ended"
            : duty.status === 5
            ? "Discarded"
            : "",
        created_on: duty.created_on,
        updated_on: duty.updated_on,
      }));

      setDutyList(dutiesWithDetails);
      setHasNextPage(duties.length === rowsPerPage);
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
    const searchParams: any = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(statusBackendValue && { status: statusBackendValue }),
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
        flexDirection: { xs: "column", lg: "row" }, // ✅ Use lg for side panel
        width: "100%",
        height: "100%",
        gap: 2,
      }}
    >
      <Box
        sx={{
          flex: selectedDuty ? { xs: "0 0 100%", lg: "0 0 65%" } : "0 0 100%",
          maxWidth: selectedDuty ? { xs: "100%", lg: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {canCreateDuty&&(
         <Button
                   variant="contained"
                   sx={{
                     ml: "auto",
                     mr: 2,
                     mb: 2,
                     px: 1.5,
                     py: 0.5,
                     fontSize: "0.75rem",
                     height: 36,
                     backgroundColor: canCreateDuty ? "#00008B" : "#6c87b7 !important",
                     color: "white",
                   }}
                   onClick={() => setOpenCreateModal(true)}
                   disabled={!canCreateDuty}
                 >
            Add New Duty
          </Button>)}

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
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                {[
                  { label: "ID", width: "80px" },
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
                    <MenuItem value="Ended">Ended</MenuItem>
                    <MenuItem value="Discarded">Discarded</MenuItem>
                  </Select>
                </TableCell>
                <TableCell />
                <TableCell />
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center"></TableCell>
                </TableRow>
              ) : dutyList.length > 0 ? (
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

                    <TableCell sx={{ textAlign: "center" }}>
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
                              :row.status === "Ended" ? "rgba(158, 158, 158, 0.12)"
                               : "#afaaaaff",
                          color:
                            row.status === "Assigned"
                              ? "#1976D2"
                              : row.status === "Started"
                              ? "#388E3C"
                              : row.status === "Terminated"
                              ? "#D32F2F"
                              :  row.status === "Ended" ? "#616161":
                               "#423e3eff",
                          fontWeight: 600,
                          fontSize: "0.75rem",
                          borderRadius: "8px",
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ textAlign: "center" }}>
                      <Tooltip title={row.operatorName} placement="bottom">
                        <Typography noWrap>
                          {row.operatorName.length > 15
                            ? `${row.operatorName.substring(0, 15)}...`
                            : row.operatorName}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      <Tooltip title={row.serviceName} placement="bottom">
                        <Typography noWrap>
                          {row.serviceName.length > 15
                            ? `${row.serviceName.substring(0, 15)}...`
                            : row.serviceName}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No Duty Found.
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
            onCloseDetailCard={() => setSelectedDuty(null)}
          />
        </Box>
      )}
<Dialog
      open={Boolean(selectedDuty)}
      onClose={() => setSelectedDuty(null)}
      fullScreen
      sx={{ display: { xs: "block", lg: "none" } }}
    >
      {selectedDuty && (
        <Box sx={{ p: 2 }}>
          <DutyDetailsCard
            duty={selectedDuty}
            onBack={() => setSelectedDuty(null)}
            refreshList={refreshList}
            onCloseDetailCard={() => setSelectedDuty(null)}
            onUpdate={() => {}}
            onDelete={() => {}}
          />
        </Box>
      )}
    </Dialog>

      {/* Create Account Modal */}
      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}

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
