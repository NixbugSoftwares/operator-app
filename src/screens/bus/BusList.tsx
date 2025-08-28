import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
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
import { useDispatch, useSelector } from "react-redux";
import { companyBusListApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { RootState } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import PaginationControls from "../../common/paginationControl";
import FormModal from "../../common/formModal";
import BusCreationForm from "./BusCreationForm";
import { Bus } from "../../types/type";
import BusDetailsCard from "./BusDetail";
import moment from "moment";

import { Chip } from "@mui/material";

const getStatusBackendValue = (displayValue: string): string => {
  const statusMap: Record<string, string> = {
    Active: "1",
    Maintenance: "2",
    Suspended: "3",
  };
  return statusMap[displayValue] || "";
};

interface ColumnConfig {
  id: string;
  label: string;
  width: string;
  minWidth: string;
  fixed?: boolean;
}
const BusListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [busList, setBusList] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [search, setSearch] = useState({
    id: "",
    registrationNumber: "",
    name: "",
    capacity_le: "",
    status: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canCreateBus = useSelector((state: RootState) =>
    state.app.permissions.includes("create_bus")
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const columnConfig: ColumnConfig[] = [
    { id: "id", label: "ID", width: "80px", minWidth: "80px", fixed: true },
    {
      id: "name",
      label: "Full Name",
      width: "200px",
      minWidth: "200px",
      fixed: true,
    },
    {
      id: "registrationNumber",
      label: "Registration Number",
      width: "160px",
      minWidth: "160px",
      fixed: true,
    },
    {
      id: "capacity",
      label: "Maximum Capacity",
      width: "120px",
      minWidth: "120px",
      fixed: true,
    },
    {
      id: "status",
      label: "Status",
      width: "150px",
      minWidth: "150px",
    },
    {
      id: "manufactured_on",
      label: "Manufactured On",
      width: "150px",
      minWidth: "150px",
    },
    {
      id: "insurance_upto",
      label: "Insurance Up To",
      width: "150px",
      minWidth: "150px",
    },
    {
      id: "pollution_upto",
      label: "Pollution Up To",
      width: "150px",
      minWidth: "150px",
    },
    {
      id: "fitness_upto",
      label: "Fitness Up To",
      width: "150px",
      minWidth: "150px",
    },
    {
      id: "road_tax_upto",
      label: "Road Tax Up To",
      width: "150px",
      minWidth: "150px",
    },
  ];
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columnConfig.reduce((acc, column) => {
      acc[column.id] = column.fixed ? true : false;
      return acc;
    }, {} as Record<string, boolean>)
  );
  const handleColumnChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    // Convert array of selected values to new visibility state
    const newVisibleColumns = Object.keys(visibleColumns).reduce((acc, key) => {
      acc[key] = value.includes(key);
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleColumns(newVisibleColumns);
  };
  const fetchBusList = useCallback(
    (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        companyBusListApi({
          limit: rowsPerPage,
          offset,
          ...searchParams,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedBusses = items.map((bus: any) => ({
            id: bus.id,
            companyId: bus.company_id,
            companyName: bus.company_name,
            registrationNumber: bus.registration_number ?? "-",
            name: bus.name ?? "-",
            capacity: bus.capacity ?? "-",
            manufactured_on: bus.manufactured_on ?? "-",
            insurance_upto: bus.insurance_upto ?? "-",
            pollution_upto: bus.pollution_upto ?? "-",
            fitness_upto: bus.fitness_upto ?? "-",
            road_tax_upto: bus.road_tax_upto ?? "-",
            status: bus.status ?? "-",
          }));
          setBusList(formattedBusses);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error: any) => {
          console.error("Fetch Error:", error);
          showErrorToast(error.message || "Failed to fetch Bus list");
        })
        .finally(() => setIsLoading(false));
    },
    [dispatch]
  );

  const handleRowClick = (bus: Bus) => {
    setSelectedBus(bus);
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
  const handleSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setSearch((prev) => ({ ...prev, status: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch((prev) => ({ ...prev, status: value }));
      setPage(0);
    }, 700);
  }, []);
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
      ...(debouncedSearch.registrationNumber && {
        registration_number: debouncedSearch.registrationNumber,
      }),
      ...(debouncedSearch.status && { status: statusBackendValue }),
      ...(debouncedSearch.name && { name: debouncedSearch.name }),
      ...(debouncedSearch.capacity_le && {
        capacity_le: debouncedSearch.capacity_le,
      }),
    };

    fetchBusList(page, searchParams);
  }, [page, debouncedSearch, fetchBusList]);
  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchBusList(page, debouncedSearch);
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
          flex: selectedBus ? { xs: "0 0 100%", lg: "0 0 65%" } : "0 0 100%",
          maxWidth: selectedBus ? { xs: "100%", lg: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
            gap: 1,
            flexWrap: "nowrap", // Force one line
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: "50%", md: "auto" },
            }}
          >
            <Select
              multiple
              value={Object.keys(visibleColumns).filter(
                (key) => visibleColumns[key]
              )}
              onChange={handleColumnChange}
              renderValue={(selected) => `Columns (${selected.length})`}
              size="small"
              sx={{
                minWidth: { xs: "120px", sm: "160px", md: "200px" },
                height: 36,
                fontSize: "0.75rem",
                "& .MuiSelect-select": { py: 0.5 },
              }}
            >
              {columnConfig.map((column) => (
                <MenuItem
                  key={column.id}
                  value={column.id}
                  disabled={column.fixed}
                >
                  <Checkbox
                    checked={visibleColumns[column.id]}
                    disabled={column.fixed}
                  />
                  <ListItemText
                    primary={column.label}
                    secondary={column.fixed ? "(Always visible)" : undefined}
                  />
                </MenuItem>
              ))}
            </Select>
          </Box>

          {canCreateBus && (
            <Button
              variant="contained"
              onClick={() => setOpenCreateModal(true)}
              sx={{
                flexShrink: 0,
                minWidth: "fit-content",
                px: 1.5, // Reduce horizontal padding
                py: 0.5, // Reduce vertical padding
                fontSize: "0.75rem", // Smaller font
                height: 36, // Match Select height
                backgroundColor: "#00008B",
                color: "white !important",
                "&.Mui-disabled": {
                  color: "#fff !important",
                },
              }}
            >
              Add New Bus
            </Button>
          )}
        </Box>

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
                {visibleColumns.id && (
                  <TableCell
                    sx={{
                      width: "80px",
                      minWidth: "80px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    ID
                  </TableCell>
                )}
                {visibleColumns.name && (
                  <TableCell
                    sx={{
                      width: "180px",
                      minWidth: "180px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Name
                  </TableCell>
                )}
                {visibleColumns.registrationNumber && (
                  <TableCell
                    sx={{
                      width: "180px",
                      minWidth: "180px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Registration Number
                  </TableCell>
                )}
                {visibleColumns.capacity && (
                  <TableCell
                    sx={{
                      width: "120px",
                      minWidth: "120px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Capacity
                  </TableCell>
                )}
                {visibleColumns.status && (
                  <TableCell
                    sx={{
                      width: "120px",
                      minWidth: "120px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Status
                  </TableCell>
                )}

                {visibleColumns.manufactured_on && (
                  <TableCell
                    sx={{
                      width: "120px",
                      minWidth: "120px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Manufactured On
                  </TableCell>
                )}

                {visibleColumns.insurance_upto && (
                  <TableCell
                    sx={{
                      width: "120px",
                      minWidth: "120px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Insurance Up To
                  </TableCell>
                )}
                {visibleColumns.pollution_upto && (
                  <TableCell
                    sx={{
                      width: "120px",
                      minWidth: "120px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Pollution Up To
                  </TableCell>
                )}
                {visibleColumns.fitness_upto && (
                  <TableCell
                    sx={{
                      width: "120px",
                      minWidth: "120px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Fitness Up To
                  </TableCell>
                )}
                {visibleColumns.road_tax_upto && (
                  <TableCell
                    sx={{
                      width: "120px",
                      minWidth: "120px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Road Tax Up To
                  </TableCell>
                )}
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
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.name}
                    onChange={(e) => handleSearchChange(e, "name")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.registrationNumber}
                    onChange={(e) =>
                      handleSearchChange(e, "registrationNumber")
                    }
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.capacity_le}
                    onChange={(e) => handleSearchChange(e, "capacity_le")}
                    fullWidth
                    type="number"
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                {visibleColumns.status && (
                  <TableCell width="10%">
                    <Select
                      value={search.status}
                      onChange={handleSelectChange}
                      displayEmpty
                      size="small"
                      fullWidth
                      sx={{ height: 40 }}
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Maintenance">Maintenance</MenuItem>
                      <MenuItem value="Suspended">Suspended</MenuItem>
                    </Select>
                  </TableCell>
                )}
                {visibleColumns.manufactured_on && <TableCell></TableCell>}
                {visibleColumns.insurance_upto && <TableCell></TableCell>}
                {visibleColumns.pollution_upto && <TableCell></TableCell>}
                {visibleColumns.fitness_upto && <TableCell></TableCell>}
                {visibleColumns.road_tax_upto && <TableCell></TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center"></TableCell>
                </TableRow>
              ) : busList.length > 0 ? (
                busList.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => handleRowClick(row)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedBus?.id === row.id ? "#E3F2FD" : "inherit",
                      "&:hover": { backgroundColor: "#E3F2FD" },
                    }}
                  >
                    {visibleColumns.id && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {row.id}
                      </TableCell>
                    )}
                    {visibleColumns.name && (
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
                    )}
                    {visibleColumns.registrationNumber && (
                      <TableCell>
                        <Typography noWrap>{row.registrationNumber}</Typography>
                      </TableCell>
                    )}
                    {visibleColumns.capacity && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {row.capacity}
                      </TableCell>
                    )}
                    {visibleColumns.status && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {row.status === 1 ? (
                          <Chip
                            label="Active"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(0, 128, 0, 0.1)", // transparent green
                              color: "green",
                              fontWeight: 500,
                            }}
                          />
                        ) : row.status === 2 ? (
                          <Chip
                            label="Maintenance"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 215, 0, 0.1)", // transparent yellow
                              color: "#b8860b", // dark goldenrod text
                              fontWeight: 500,
                            }}
                          />
                        ) : row.status === 3 ? (
                          <Chip
                            label="Suspended"
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 0, 0, 0.1)", // transparent red
                              color: "red",
                              fontWeight: 500,
                            }}
                          />
                        ) : null}
                      </TableCell>
                    )}
                    {visibleColumns.manufactured_on && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {moment(row.manufactured_on)
                          .local()
                          .format("DD-MM-YYYY")}
                      </TableCell>
                    )}
                    {visibleColumns.insurance_upto && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {moment(row.insurance_upto).isValid()
                          ? moment(row.insurance_upto)
                              .local()
                              .format("DD-MM-YYYY")
                          : "Not added yet"}
                      </TableCell>
                    )}
                    {visibleColumns.pollution_upto && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {moment(row.pollution_upto).isValid()
                          ? moment(row.pollution_upto)
                              .local()
                              .format("DD-MM-YYYY")
                          : "Not added yet"}
                      </TableCell>
                    )}
                    {visibleColumns.fitness_upto && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {moment(row.fitness_upto).isValid()
                          ? moment(row.fitness_upto)
                              .local()
                              .format("DD-MM-YYYY")
                          : "Not added yet"}
                      </TableCell>
                    )}
                    {visibleColumns.road_tax_upto && (
                      <TableCell sx={{ textAlign: "center" }}>
                        {moment(row.road_tax_upto).isValid()
                          ? moment(row.road_tax_upto)
                              .local()
                              .format("DD-MM-YYYY")
                          : "Not added yet"}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No Bus found.
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
      {/* 🔹 Right Side Details (Large Screens) */}
      {selectedBus && (
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
          <BusDetailsCard
            bus={selectedBus}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedBus(null)}
            refreshList={(value: any) => refreshList(value)}
            onCloseDetailCard={() => setSelectedBus(null)}
          />
        </Box>
      )}

      {/* 🔹 Dialog for Mobile/Tablet */}
      <Dialog
        open={Boolean(selectedBus)}
        onClose={() => setSelectedBus(null)}
        fullScreen
        sx={{ display: { xs: "block", lg: "none" } }} // ✅ Show on mobile + tablet
      >
        {selectedBus && (
          <Box sx={{ p: 2 }}>
            <BusDetailsCard
              bus={selectedBus}
              onUpdate={() => {}}
              onDelete={() => {}}
              onBack={() => setSelectedBus(null)}
              refreshList={(value: any) => refreshList(value)}
              onCloseDetailCard={() => setSelectedBus(null)}
            />
          </Box>
        )}
      </Dialog>

      {/* 🔹 Create Bus Modal */}
      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
      >
        <BusCreationForm
          refreshList={refreshList}
          onClose={() => setOpenCreateModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default BusListingTable;
