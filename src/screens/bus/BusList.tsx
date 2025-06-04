import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
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

const BusListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [busList, setBusList] = useState<Bus[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [search, setSearch] = useState({
    id: "",
    registrationNumber: "",
    name: "",
    capacity: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canManageBus = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_bus")
  );
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const fetchBusList = useCallback(
    (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        companyBusListApi({ limit: rowsPerPage, offset, ...searchParams })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          console.log("items", items);
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
        .catch((error) => {
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

  const handleChangePage = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  useEffect(() => {
    const searchParams: any = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(debouncedSearch.registrationNumber && {
        registration_number: debouncedSearch.registrationNumber,
      }),
      ...(debouncedSearch.name && { name: debouncedSearch.name }),
      ...(debouncedSearch.capacity && { capacity: debouncedSearch.capacity }),
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
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        height: "100%",
        gap: 2,
      }}
    >
      <Box
        sx={{
          flex: selectedBus ? { xs: "0 0 100%", md: "0 0 65%" } : "0 0 100%",
          maxWidth: selectedBus ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tooltip
            title={
              !canManageBus
                ? "You don't have permission, contact the admin"
                : "Click to open the Bus creation form"
            }
            placement="top-end"
          >
            <span style={{ cursor: !canManageBus ? "not-allowed" : "pointer" }}>
              <Button
                sx={{
                  ml: "auto",
                  mr: 2,
                  mb: 2,
                  backgroundColor: !canManageBus
                    ? "#6c87b7 !important"
                    : "#00008B",
                  color: "white",
                }}
                variant="contained"
                onClick={() => setOpenCreateModal(true)}
                disabled={!canManageBus}
              >
                Add New Bus
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
                {["ID", "Name", "Registration Number", "Capacity"].map(
                  (label, index) => {
                    const key = [
                      "id",
                      "name",
                      "registrationNumber",
                      "capacity",
                    ][index] as keyof typeof search;

                    const isNumberField = key === "id" || key === "capacity";

                    return (
                      <TableCell key={label}>
                        <b
                          style={{
                            display: "block",
                            textAlign: "center",
                            fontSize: selectedBus ? "0.8rem" : "1rem",
                          }}
                        >
                          {label}
                        </b>
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
                              fontSize: selectedBus ? "0.8rem" : "1rem",
                            },
                            "& .MuiInputBase-input": {
                              textAlign: "center",
                              fontSize: selectedBus ? "0.8rem" : "1rem",
                            },
                          }}
                        />
                      </TableCell>
                    );
                  }
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {busList.length > 0 ? (
                busList.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => handleRowClick(row)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedBus?.id === row.id ? "#E3F2FD" : "inherit",
                        "&:hover": {
                          backgroundColor: "#E3F2FD",
                        },
                      }}
                    >
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.registrationNumber}</TableCell>
                      <TableCell>{row.capacity}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
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
      {/* Right Side - Account Details Card */}
      {selectedBus && (
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
          <BusDetailsCard
            bus={selectedBus}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedBus(null)}
            refreshList={(value: any) => refreshList(value)}
            canManageCompany={canManageBus}
            onCloseDetailCard={() => setSelectedBus(null)}
          />
        </Box>
      )}

      {/* Create Account Modal */}
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
