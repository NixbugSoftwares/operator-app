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
  MenuItem,
  Autocomplete,
  Grid,
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

const typeOptions = [
  { label: "Driver", value: 1 },
  { label: "Conductor", value: 2 },
  { label: "Kili", value: 3 },
  { label: "Other", value: 4 },
];

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
  } = useForm<Duty>({
    defaultValues: {},
  });

  const fetchOperatorList = useCallback(
    (pageNumber: number, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        operatorListApi({
          limit: rowsPerPage,
          offset,
          fullName: searchText,
        })
      )
        .unwrap()
        .then((res) => {
          console.log("res()()()()())()", res);

          const items = res.data || [];
          console.log("items", items);

          const formattedList = items.map((item: any) => ({
            id: item.id,
            name: item.full_name ?? "-",
          }));

          console.log("fullname", formattedList.name);
          setDropdownData((prev) => ({
            ...prev,
            operatorList:
              pageNumber === 0
                ? formattedList
                : [...prev.operatorList, ...formattedList],
          }));
          setHasMore((prev) => ({
            ...prev,
            operator: items.length === rowsPerPage,
          }));
        })
        .catch((error) => {
          showErrorToast(error.message || "Failed to fetch operator list");
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
  );

  const fetchServiceList = useCallback(
    (pageNumber: number, searchText = "") => {
      setLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        serviceListingApi({
          limit: rowsPerPage,
          offset,
          name: searchText,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          console.log("items", items);

          const formattedList = items.map((item: any) => ({
            id: item.id,
            name: item.name ?? "-",
          }));
          setDropdownData((prev) => ({
            ...prev,
            serviceList:
              pageNumber === 0
                ? formattedList
                : [...prev.serviceList, ...formattedList],
          }));
          setHasMore((prev) => ({
            ...prev,
            service: items.length === rowsPerPage,
          }));
        })
        .catch((error) => {
          showErrorToast(error.message || "Failed to fetch Service list");
        })
        .finally(() => setLoading(false));
    },
    [dispatch]
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

    if (data.type) {
      formData.append("type", data.type.toString());
    }

    const response = await dispatch(dutyCreationApi(formData)).unwrap();

    if (response?.id) {
      showSuccessToast("Duty created successfully!");
      refreshList("refresh");
      onClose();
    } else {
      showErrorToast("Duty creation failed. Please try again.");
    }
  } catch (error) {
    showErrorToast("Something went wrong. Please try again.");
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

      switch (type) {
        case "operator":
          fetchOperatorList(newPage, searchParams.operator);
          break;
        case "service":
          fetchServiceList(newPage, searchParams.service);
          break;
      }
    }
  };

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

    <Box component="form" noValidate onSubmit={handleSubmit(handleDutyCreation)}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Controller
            name="operator_id"
            control={control}
            rules={{ required: "Operator is required" }}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.operatorList}
                getOptionLabel={(option) => option.name}
                value={dropdownData.operatorList.find((item) => item.id === field.value) || null}
                onChange={(_, newValue) => field.onChange(newValue?.id)}
                onInputChange={(_, newInputValue) => {
                  setSearchParams((prev) => ({ ...prev, route: newInputValue }));
                  setPage((prev) => ({ ...prev, route: 0 }));
                  fetchOperatorList(0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Operator"
                    error={!!errors.operator_id}
                    helperText={errors.operator_id?.message}
                    required
                    fullWidth
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "operator"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
              />
            )}
          />
        </Grid>

        {/* Service */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="service_id"
            control={control}
            rules={{ required: "Service is required" }}
            render={({ field }) => (
              <Autocomplete
                options={dropdownData.serviceList}
                getOptionLabel={(option) => option.name}
                value={dropdownData.serviceList.find((item) => item.id === field.value) || null}
                onChange={(_, newValue) => field.onChange(newValue?.id)}
                onInputChange={(_, newInputValue) => {
                  setSearchParams((prev) => ({ ...prev, bus: newInputValue }));
                  fetchServiceList(0, newInputValue);
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Service"
                    error={!!errors.service_id}
                    helperText={errors.service_id?.message}
                    required
                    fullWidth
                  />
                )}
                ListboxProps={{
                  onScroll: (event) => handleScroll(event, "service"),
                  style: { maxHeight: 200, overflow: "auto" },
                }}
              />
            )}
          />
        </Grid>

        {/* Type */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                label="Type"
                select
                {...field}
                error={!!errors.type}
                helperText={errors.type?.message}
                fullWidth
                size="small"
              >
                {typeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{ minWidth: 150, bgcolor: "darkblue" }}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} sx={{ color: "white" }} />
          ) : (
            "Create Duty"
          )}
        </Button>
      </Box>
    </Box>
  </Box>
</Container>

  );
};

export default DutyCreationForm;
