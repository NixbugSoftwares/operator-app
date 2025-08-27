import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  Typography,
  TextField,
  Tooltip,
  Chip,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
  MenuItem,
  Select,
} from "@mui/material";
import { useDispatch } from "react-redux";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import SchoolIcon from "@mui/icons-material/School";
import BoyIcon from "@mui/icons-material/Boy";
import { fareListApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import FareSkeletonPage from "./fareSkeletonPage";
import { Fare } from "../../types/type";
import PaginationControls from "../../common/paginationControl";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
import moment from "moment";

interface ColumnConfig {
  id: string;
  label: string;
  width: string;
  minWidth: string;
  fixed?: boolean;
}

const CompanyFareListingPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [fareList, setFareList] = useState<Fare[]>([]);
  const [selectedFare, setSelectedFare] = useState<Fare | null>(null);
  const [search, setSearch] = useState({
    id: "",
    name: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const [hasNextPage, setHasNextPage] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "create" | "view">("list");
  const canCreateFare = useSelector((state: RootState) =>
    state.app.permissions.includes("create_fare")
  );
  const columnConfig: ColumnConfig[] = [
    { id: "id", label: "ID", width: "80px", minWidth: "80px", fixed: true },
    {
      id: "name",
      label: "Fare Name",
      width: "200px",
      minWidth: "200px",
      fixed: true,
    },
    {
      id: "ticket_types",
      label: "Ticket Types",
      width: "160px",
      minWidth: "160px",
      fixed: true,
    },

    {
      id: "created_at",
      label: "Created Date",
      width: "150px",
      minWidth: "150px",
      fixed: true,
    },
  ];
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columnConfig.reduce((fare, column) => {
      fare[column.id] = column.fixed ? true : false;
      return fare;
    }, {} as Record<string, boolean>)
  );
  const handleColumnChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    // Convert array of selected values to new visibility state
    const newVisibleColumns = Object.keys(visibleColumns).reduce(
      (fare, key) => {
        fare[key] = value.includes(key);
        return fare;
      },
      {} as Record<string, boolean>
    );
    setVisibleColumns(newVisibleColumns);
  };

  const fetchCompanyFares = useCallback(
    async (pageNumber: number, searchParams = {}) => {
      const offset = pageNumber * rowsPerPage;
      setIsLoading(true);
      try {
        const localRes = await dispatch(
          fareListApi({
            limit: rowsPerPage,
            offset,
            ...searchParams,
          })
        ).unwrap();

        const globalRes = await dispatch(
          fareListApi({ limit: rowsPerPage, offset, scope: 1, ...searchParams })
        ).unwrap();

        const localFares = localRes.data || [];
        const globalFares = globalRes.data || [];

        const allFares = [...localFares, ...globalFares].filter(
          (fare, index, self) =>
            index === self.findIndex((f) => f.id === fare.id)
        );

        const formattedFares = allFares.map((fare: any) => ({
          id: fare.id,
          name: fare.name,
          version: fare.version,
          attributes: {
            df_version: fare.attributes?.df_version || 1,
            ticket_types: fare.attributes?.ticket_types || [],
            currency_type: fare.attributes?.currency_type,
            distance_unit: fare.attributes?.distance_unit || "m",
            extra: fare.attributes?.extra || {},
          },
          function: fare.function,
          scope: fare.scope,
          created_on: fare.created_on,
        }));

        setFareList(formattedFares);
        setHasNextPage(allFares.length === rowsPerPage);
      } catch (error: any) {
        showErrorToast(
          error.message || "Failed to fetch fare list. Please try again."
        );
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch]
  );

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

  const handleChangePage = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  useEffect(() => {
    const searchParams = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(debouncedSearch.name && { name: debouncedSearch.name }),
    };
    fetchCompanyFares(page, searchParams);
  }, [page, debouncedSearch, fetchCompanyFares]);
  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchCompanyFares(page, debouncedSearch);
    }
  };

  if (viewMode === "create" || viewMode === "view") {
    return (
      <FareSkeletonPage
        onCancel={() => {
          setViewMode("list");
          setSelectedFare(null);
        }}
        refreshList={refreshList}
        fareToEdit={viewMode === "view" ? selectedFare : null}
        mode={viewMode}
      />
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "100vh",
        }}
      >
        <Box
          sx={{
            flex: "0 0 100%",
            maxWidth: "1000%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid #e0e0e0",
          }}
        >
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 2,
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                marginLeft: "auto",
              }}
            >
              {1 > 100 && (
                <Select
                  multiple
                  value={Object.keys(visibleColumns).filter(
                    (key) => visibleColumns[key]
                  )}
                  onChange={handleColumnChange}
                  renderValue={(selected) =>
                    `Selected Columns (${selected.length})`
                  }
                  sx={{
                    minWidth: 200,
                    height: 40,
                    ".MuiSelect-select": {
                      py: 1.2,
                    },
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
                        secondary={
                          column.fixed ? "(Always visible)" : undefined
                        }
                      />
                    </MenuItem>
                  ))}
                </Select>
              )}

              {canCreateFare && (
                <Button
                  sx={{
                    height: 40, // Match height with Select for alignment
                    backgroundColor: !canCreateFare
                      ? "#6c87b7 !important"
                      : "#00008B",
                    color: "white",
                    "&.Mui-disabled": {
                      backgroundColor: "#6c87b7 !important",
                      color: "#ffffff99",
                    },
                    px: 3, // Horizontal padding
                  }}
                  variant="contained"
                  onClick={() => setViewMode("create")}
                  disabled={!canCreateFare}
                >
                  Add New Fare
                </Button>
              )}
            </Box>
          </Box>

          <TableContainer
            sx={{
              flex: 1,
              overflowY: "auto",
              "& .MuiTableCell-root": {
                padding: "8px 12px",
              },
              "& .MuiTableCell-head": {
                // Header centering fix
                textAlign: "center",
                padding: "8px 12px",
                "& > *": {
                  justifyContent: "center",
                  margin: "0 auto",
                },
              },
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  {visibleColumns.id && (
                    <TableCell sx={{ width: "10%" }}>
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                      >
                        <b>ID</b>
                      </Box>
                    </TableCell>
                  )}

                  {/* Name Column */}
                  {visibleColumns.name && (
                    <TableCell sx={{ width: "25%" }}>
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                      >
                        <b>Name</b>
                      </Box>
                    </TableCell>
                  )}

                  {/* Ticket Types Header */}
                  {visibleColumns.ticket_types && (
                    <TableCell>
                      <b style={{ display: "block", textAlign: "center" }}>
                        Ticket Types
                      </b>
                    </TableCell>
                  )}
                  {/* Created On Header */}
                  {visibleColumns.created_at && (
                    <TableCell>
                      <b style={{ display: "block", textAlign: "center" }}>
                        Created On
                      </b>
                    </TableCell>
                  )}
                </TableRow>
                <TableRow>
                  {visibleColumns.id && (
                    <TableCell>
                      <TextField
                        type="number"
                        variant="outlined"
                        size="small"
                        placeholder="Search"
                        value={search.id}
                        onChange={(e) => handleSearchChange(e, "id")}
                        sx={{
                          width: "100%",
                          mt: 1,
                          "& .MuiInputBase-root": { height: 36 },
                        }}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.name && (
                    <TableCell>
                      <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search"
                        value={search.name}
                        onChange={(e) => handleSearchChange(e, "name")}
                        sx={{
                          width: "100%",
                          mt: 1,
                          "& .MuiInputBase-root": { height: 36 },
                        }}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.ticket_types && <TableCell></TableCell>}
                  {visibleColumns.version && <TableCell></TableCell>}
                  {visibleColumns.created_at && <TableCell></TableCell>}
                </TableRow>
              </TableHead>

              <TableBody>
                {fareList.length > 0 ? (
                  fareList.map((fare) => {
                    const isSelected = selectedFare?.id === fare.id;
                    return (
                      <TableRow
                        key={fare.id}
                        hover
                        selected={isSelected}
                        onClick={() => {
                          setSelectedFare(fare);
                          setViewMode("view");
                        }}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "#E3F2FD !important"
                            : "inherit",
                          "&:hover": { backgroundColor: "#E3F2FD" },
                        }}
                      >
                        {/* ID */}
                        {visibleColumns.id && (
                          <TableCell
                            sx={{
                              fontWeight: 500,
                              textAlign: "center",
                              height: 60,
                            }}
                          >
                            {fare.id}
                          </TableCell>
                        )}

                        {/* Name */}
                        {visibleColumns.name && (
                          <TableCell>
                            <Tooltip title={fare.name} placement="bottom">
                              <Typography noWrap>
                                {fare.name.length > 30
                                  ? `${fare.name.substring(0, 30)}...`
                                  : fare.name}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                        )}

                        {/* Ticket Types - Block Style */}

                        {visibleColumns.ticket_types && (
                          <TableCell
                            sx={{
                              maxWidth: 300, // Prevents cell from stretching
                            }}
                          >
                            {fare.attributes.ticket_types?.length > 0 ? (
                              <Box
                                sx={{
                                  display: "grid",
                                  gridTemplateColumns: "repeat(2, 1fr)", // 2 chips per row
                                  gap: 1, // spacing
                                }}
                              >
                                {fare.attributes.ticket_types.map(
                                  (type, index) => {
                                    const typeName =
                                      type.name?.toLowerCase() || "";
                                    const typeConfig = {
                                      adult: {
                                        bg: "rgba(25, 118, 210, 0.1)",
                                        color: "#1565c0",
                                        icon: <PersonIcon fontSize="small" />,
                                      },
                                      child: {
                                        bg: "rgba(255, 152, 0, 0.1)",
                                        color: "#ef6c00",
                                        icon: (
                                          <ChildCareIcon fontSize="small" />
                                        ),
                                      },
                                      student: {
                                        bg: "rgba(76, 175, 80, 0.1)",
                                        color: "#2e7d32",
                                        icon: <SchoolIcon fontSize="small" />,
                                      },
                                      other: {
                                        bg: "#554e4e3f",
                                        color: "#080000ff",
                                        icon: <BoyIcon fontSize="small" />,
                                      },
                                    };

                                    let typeKey:
                                      | "adult"
                                      | "child"
                                      | "student"
                                      | "other" = "other";
                                    if (typeName.includes("adult"))
                                      typeKey = "adult";
                                    else if (typeName.includes("child"))
                                      typeKey = "child";
                                    else if (typeName.includes("student"))
                                      typeKey = "student";

                                    return (
                                      <Chip
                                        key={index}
                                        size="small"
                                        icon={typeConfig[typeKey].icon}
                                        label={type.name || `Type ${index + 1}`}
                                        sx={{
                                          justifyContent: "flex-start",
                                          borderRadius: "4px",
                                          backgroundColor:
                                            typeConfig[typeKey].bg,
                                          color: typeConfig[typeKey].color,
                                          "& .MuiChip-icon": {
                                            color: typeConfig[typeKey].color,
                                            opacity: 0.8,
                                            marginLeft: "8px",
                                          },
                                        }}
                                      />
                                    );
                                  }
                                )}
                              </Box>
                            ) : (
                              <Tooltip title="No ticket types">
                                <ErrorIcon color="disabled" />
                              </Tooltip>
                            )}
                          </TableCell>
                        )}

                        {/* Created On */}
                        {visibleColumns.created_at && (
                          <TableCell align="center">
                            {moment(fare.created_on)
                              .local()
                              .format("DD-MM-YYYY, hh:mm A")}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No fares found
                      </Typography>
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
      </Box>
    </>
  );
};

export default CompanyFareListingPage;
