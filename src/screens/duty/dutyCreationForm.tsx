import React, { useCallback, useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  CssBaseline,
  CircularProgress,
  Autocomplete,
  Stack,
} from "@mui/material";
import { useAppDispatch } from "../../store/Hooks";
import {
  dutyCreationApi,
  operatorListApi,
  serviceListingApi,
} from "../../slices/appSlice";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Duty } from "../../types/type";

interface IOperatorCreationFormProps {
  onClose: () => void;
  refreshList: (value: any) => void;
}

interface DropdownItem {
  id: number;
  name: string;
}

const DutyCreationForm: React.FC<IOperatorCreationFormProps> = ({
  onClose,
  refreshList,
}) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [dropdownData, setDropdownData] = useState({
    operatorList: [] as DropdownItem[],
    serviceList: [] as DropdownItem[],
  });
  const [searchParams, setSearchParams] = useState({
    operator: "",
    service: "",
  });
  const [page, setPage] = useState({
    operator: 0,
    service: 0,
  });
  const [hasMore, setHasMore] = useState({
    operator: true,
    service: true,
  });

  const rowsPerPage = 10;
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Duty>();

  const fetchData = useCallback(
    async (
      api: any,
      type: "operator" | "service",
      pageNumber: number,
      searchText = ""
    ) => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;

      try {
        const res = await dispatch(
          api({
            limit: rowsPerPage,
            offset,
            ...(type === "operator" ? { full_name: searchText } : {}),
          })
        ).unwrap();

        const items = res.data || [];
        const formattedList = items.map((item: any) => ({
          id: item.id,
          name:
            type === "operator"
              ? item.full_name ?? item.username
              : item.name ?? "-",
        }));

        setDropdownData((prev) => ({
          ...prev,
          [`${type}List`]:
            pageNumber === 0
              ? formattedList
              : [...prev[`${type}List`], ...formattedList],
        }));
        setHasMore((prev) => ({
          ...prev,
          [type]: items.length === rowsPerPage,
        }));
      } catch (error: any) {
        showErrorToast(error.message || `Failed to fetch ${type} list`);
      } finally {
        setLoading(false);
      }
    },
    [dispatch, rowsPerPage]
  );

  const fetchOperatorList = useCallback(
    (pageNumber: number, searchText = "") =>
      fetchData(operatorListApi, "operator", pageNumber, searchText),
    [fetchData]
  );

  const fetchServiceList = useCallback(
    (pageNumber: number) => fetchData(serviceListingApi, "service", pageNumber),
    [fetchData]
  );

  useEffect(() => {
    fetchOperatorList(0);
    fetchServiceList(0);
  }, [fetchOperatorList, fetchServiceList]);

  const handleDutyCreation: SubmitHandler<Duty> = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("operator_id", data.operator_id.toString());
      formData.append("service_id", data.service_id.toString());

      const response = await dispatch(dutyCreationApi(formData)).unwrap();

      if (response?.id) {
        showSuccessToast("Duty created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Duty creation failed. Please try again.");
      }
    } catch (error: any) {
      showErrorToast(error || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (
    event: React.UIEvent<HTMLElement>,
    type: "operator" | "service"
  ) => {
    const element = event.currentTarget;
    if (
      element.scrollHeight - element.scrollTop === element.clientHeight &&
      hasMore[type]
    ) {
      const newPage = page[type] + 1;
      setPage((prev) => ({ ...prev, [type]: newPage }));
      type === "operator"
        ? fetchOperatorList(newPage, searchParams.operator)
        : fetchServiceList(newPage);
    }
  };

  const renderAutocomplete = (
    name: keyof Duty,
    label: string,
    options: DropdownItem[],
    type: "operator" | "service"
  ) => (
    <Controller
      name={name}
      control={control}
      rules={{ required: `${label} is required` }}
      render={({ field }) => (
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id} // Add this line
          value={options.find((item) => item.id === field.value) || null}
          onChange={(_, newValue) => field.onChange(newValue?.id)}
          onInputChange={(_, newInputValue) => {
            if (type === "operator") {
              setSearchParams((prev) => ({ ...prev, operator: newInputValue }));
              setPage((prev) => ({ ...prev, operator: 0 }));
              fetchOperatorList(0, newInputValue);
            }
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={`Select ${label}`}
              error={!!errors[name]}
              helperText={errors[name]?.message}
              required
              fullWidth
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {" "}
              {/* Use ID as key here */}
              {option.name} {/* Display the name */}
            </li>
          )}
          ListboxProps={{
            onScroll: (event) => handleScroll(event, type),
            style: { maxHeight: 200, overflow: "auto" },
          }}
        />
      )}
    />
  );

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box
        sx={{
          mt: 4,
          mb: 4,
          px: 2,
          py: 3,
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
          boxShadow: 3,
        }}
      >
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Duty Creation
        </Typography>

        <Box
          component="form"
          noValidate
          onSubmit={handleSubmit(handleDutyCreation)}
          sx={{ width: "100%" }}
        >
          <Stack spacing={3}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ width: "100%" }}
            >
              <Box sx={{ flex: 1 }}>
                {renderAutocomplete(
                  "operator_id",
                  "Operator",
                  dropdownData.operatorList,
                  "operator"
                )}
              </Box>
              <Box sx={{ flex: 1 }}>
                {renderAutocomplete(
                  "service_id",
                  "Service",
                  dropdownData.serviceList,
                  "service"
                )}
              </Box>
            </Stack>

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{
                  minWidth: 150,
                  bgcolor: "darkblue",
                  "&:hover": {
                    bgcolor: "darkblue",
                    opacity: 0.9,
                  },
                }}
                disabled={loading}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Create Duty"
                )}
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Container>
  );
};

export default DutyCreationForm;
