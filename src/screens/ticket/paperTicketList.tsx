import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Typography,
} from "@mui/material";
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import { useDispatch } from "react-redux";
import { paperTicketListingApi, landmarkNameApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import { PaperTicket } from "../../types/type";
import PaginationControls from "../../common/paginationControl";
// import AccountDetailsCard from "./AccountDetail";
interface PaperTicketListingTableProps {
  serviceId?: number;
}

const PaperTicketListingTable: React.FC<PaperTicketListingTableProps> = ({
  serviceId,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [paperTicketList, setPaperTicketList] = useState<PaperTicket[]>([]);
  const [selectedPaperTicket, setSelectedPaperTicket] =
    useState<PaperTicket | null>(null);
  const [search, setSearch] = useState({
    id: "",
    duty_id: "",
    pickupName: "",
    droppingName: "",
    amount: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;

  const fetchTicketList = useCallback(
    async (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;
      try {
        const res = await dispatch(
          paperTicketListingApi({ limit: rowsPerPage, offset, ...searchParams })
        ).unwrap();
        const items = res.data || [];
        // Fetch names for duty and landmarks in parallel
        const ticketsWithNames = await Promise.all(
          items.map(async (ticket: any) => {
            let dutyName = ticket.duty_id;
            let pickupName = ticket.pickup_point;
            let droppingName = ticket.dropping_point;

            try {
              // Fetch pickup landmark name
              if (ticket.pickup_point) {
                const pickupRes = await dispatch(
                  landmarkNameApi({
                    limit: 1,
                    offset: 0,
                    id: ticket.pickup_point,
                  })
                ).unwrap();
                pickupName = pickupRes.data?.[0]?.name || ticket.pickup_point;
              }
              // Fetch dropping landmark name
              if (ticket.dropping_point) {
                const dropRes = await dispatch(
                  landmarkNameApi({
                    limit: 1,
                    offset: 0,
                    id: ticket.dropping_point,
                  })
                ).unwrap();
                droppingName = dropRes.data?.[0]?.name || ticket.dropping_point;
              }
            } catch (err) {
              // fallback to IDs if error
            }

            return {
              id: ticket.id,
              service_id: ticket.service_id,
              sequence_id: ticket.sequence_id,
              duty_id: ticket.duty_id,
              dutyName,
              pickup_point: ticket.pickup_point,
              pickupName,
              dropping_point: ticket.dropping_point,
              droppingName,
              amount: ticket.amount,
            };
          })
        );
        console.log("ticketsWithNames", ticketsWithNames);

        setPaperTicketList(ticketsWithNames);
        setHasNextPage(items.length === rowsPerPage);
      } catch (error: any) {
        console.error("Fetch Error:", error);
        showErrorToast(error.message || "Failed to fetch paper ticket list");
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, rowsPerPage]
  );

  const handleRowClick = (paperTicket: PaperTicket) => {
    setSelectedPaperTicket(paperTicket);
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
    const fetchLandmarkIdsAndTickets = async () => {
      const searchParams: any = {
        ...(debouncedSearch.id && { id: debouncedSearch.id }),
        ...(debouncedSearch.amount && { amount: debouncedSearch.amount }),
        ...(serviceId && { service_id: serviceId }),
      };

      try {
        // Fetch pickup landmark ID(s) by name
        if (debouncedSearch.pickupName) {
          const pickupRes = await dispatch(
            landmarkNameApi({
              name: debouncedSearch.pickupName,
              limit: 10,
              offset: 0,
            })
          ).unwrap();
          const pickupIds = pickupRes.data.map((item: any) => item.id);
          if (pickupIds.length > 0) {
            searchParams.pickup_point = pickupIds.join(","); // Or pass array if API supports it
          }
        }

        // Fetch dropping landmark ID(s) by name
        if (debouncedSearch.droppingName) {
          const dropRes = await dispatch(
            landmarkNameApi({
              name: debouncedSearch.droppingName,
              limit: 10,
              offset: 0,
            })
          ).unwrap();
          const droppingIds = dropRes.data.map((item: any) => item.id);
          if (droppingIds.length > 0) {
            searchParams.dropping_point = droppingIds.join(",");
          }
        }

        fetchTicketList(page, searchParams);
      } catch (err) {
        console.error("Search Landmark Error:", err);
        fetchTicketList(page, searchParams); // fallback with basic filters
      }
    };

    fetchLandmarkIdsAndTickets();
  }, [page, debouncedSearch, fetchTicketList, serviceId, dispatch]);

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
          flex: selectedPaperTicket
            ? { xs: "0 0 100%", md: "0 0 65%" }
            : "0 0 100%",
          maxWidth: selectedPaperTicket ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
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
          { label: "Pickup Point", width: "200px" },
          { label: "Drop Point", width: "200px" },
          { label: "Amount", width: "120px" },
        ].map((col) => (
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
            type="number"
            variant="outlined"
            size="small"
            placeholder="Search"
            value={search.id}
            onChange={(e) => handleSearchChange(e, "id")}
            fullWidth
            sx={{
              "& .MuiInputBase-root": { height: 40 },
              "& .MuiInputBase-input": { textAlign: "center" },
            }}
          />
        </TableCell>
        <TableCell>
          <TextField
            type="text"
            variant="outlined"
            size="small"
            placeholder="Search"
            value={search.pickupName}
            onChange={(e) => handleSearchChange(e, "pickupName")}
            fullWidth
            sx={{
              "& .MuiInputBase-root": { height: 40 },
              "& .MuiInputBase-input": { textAlign: "center" },
            }}
          />
        </TableCell>
        <TableCell>
          <TextField
            type="text"
            variant="outlined"
            size="small"
            placeholder="Search"
            value={search.droppingName}
            onChange={(e) => handleSearchChange(e, "droppingName")}
            fullWidth
            sx={{
              "& .MuiInputBase-root": { height: 40 },
              "& .MuiInputBase-input": { textAlign: "center" },
            }}
          />
        </TableCell>
        <TableCell>
          <TextField
            type="number"
            variant="outlined"
            size="small"
            placeholder="Search"
            value={search.amount}
            onChange={(e) => handleSearchChange(e, "amount")}
            fullWidth
            sx={{
              "& .MuiInputBase-root": { height: 40 },
              "& .MuiInputBase-input": { textAlign: "center" },
            }}
          />
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {paperTicketList.length > 0 ? (
        paperTicketList.map((row) => (
          <TableRow
            key={row.id}
            hover
            onClick={() => handleRowClick(row)}
            sx={{
              cursor: "pointer",
              backgroundColor:
                selectedPaperTicket?.id === row.id ? "#E3F2FD" : "inherit",
              "&:hover": { backgroundColor: "#E3F2FD" },
            }}
          >
            <TableCell sx={{ textAlign: "center" }}>{row.id}</TableCell>
            <TableCell>
              <Typography noWrap>{row.pickupName}</Typography>
            </TableCell>
            <TableCell>
              <Typography noWrap>{row.droppingName}</Typography>
            </TableCell>
            <TableCell sx={{ textAlign: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CurrencyRupeeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography component="span" fontWeight={600}>
                  {row.amount}
                </Typography>
              </Box>
            </TableCell>
          </TableRow>
        ))
      ) : (
        <TableRow>
          <TableCell colSpan={4} align="center">
            <Typography variant="body1" color="textSecondary" mt={2}>
              No tickets found.
            </Typography>
          </TableCell>
        </TableRow>
      )}
    </TableBody>
  </Table>
</TableContainer>
        {/* Pagination */}
        <PaginationControls
          page={page}
          onPageChange={(newPage) => handleChangePage(null, newPage)}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
        />
      </Box>

      {/* Right Side - Account Details Card */}
      {selectedPaperTicket && (
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
          {/* <AccountDetailsCard
            account={selectedAccount}
            canManageOperator={canManageOperator}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedAccount(null)}
            refreshList={(value: any) => refreshList(value)}
            onCloseDetailCard={() => setSelectedAccount(null)}
          /> */}
        </Box>
      )}
    </Box>
  );
};
export default PaperTicketListingTable;
