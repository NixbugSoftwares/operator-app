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
import { showErrorToast, showSuccessToast } from "../../common/toastMessageHelper";
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
  const [operatorList, setOperatorList] = useState<DropdownItem[]>([]);
  const [serviceList, setServiceList] = useState<DropdownItem[]>([]);
  
  const [operatorSearch, setOperatorSearch] = useState("");
  const [operatorPage, setOperatorPage] = useState(0);
  const [hasMoreOperators, setHasMoreOperators] = useState(true);
  
  const [servicePage, setServicePage] = useState(0);
  const [hasMoreServices, setHasMoreServices] = useState(true);

  const rowsPerPage = 10;
  const { handleSubmit, control, formState: { errors } } = useForm<Duty>();

  // Fetch operators with pagination and search
  const fetchOperators = useCallback(async (pageNumber: number, searchText = "") => {
    setLoading(true);
    const offset = pageNumber * rowsPerPage;
    
    try {
      const res = await dispatch(operatorListApi({
        limit: rowsPerPage,
        offset,
        status: 1,
        full_name: searchText,
      })).unwrap();

      const operators = res.data || [];
      const formattedOperators = operators.map((operator: any) => ({
        id: operator.id,
        name: operator.full_name ?? operator.username,
      }));

      setOperatorList(prev => 
        pageNumber === 0 ? formattedOperators : [...prev, ...formattedOperators]
      );
      setHasMoreOperators(operators.length === rowsPerPage);
    } catch (error: any) {
      showErrorToast(error.message || "Failed to fetch operators");
    } finally {
      setLoading(false);
    }
  }, [dispatch, rowsPerPage]);

  // Fetch services with pagination and status filter
  const fetchServices = useCallback(async (pageNumber: number) => {
    setLoading(true);
    const offset = pageNumber * rowsPerPage;
    
    try {
      const res = await dispatch(serviceListingApi({
        limit: rowsPerPage,
        offset,
        status_list: [1, 2], // Only active and pending services
      })).unwrap();

      const services = res.data || [];
      const formattedServices = services.map((service: any) => ({
        id: service.id,
        name: service.name ?? "-",
      }));

      setServiceList(prev => 
        pageNumber === 0 ? formattedServices : [...prev, ...formattedServices]
      );
      setHasMoreServices(services.length === rowsPerPage);
    } catch (error: any) {
      showErrorToast(error.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  }, [dispatch,  rowsPerPage]);

  // Initial data load
  useEffect(() => {
    fetchOperators(0);
    fetchServices(0);
  }, [fetchOperators, fetchServices]);

  // Handle operator search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setOperatorPage(0);
      fetchOperators(0, operatorSearch);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [operatorSearch, fetchOperators]);

  const handleDutyCreation: SubmitHandler<Duty> = async (data) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('operator_id', data.operator_id.toString());
      formData.append('service_id', data.service_id.toString());

      const response = await dispatch(dutyCreationApi(formData)).unwrap();

      if (response?.id) {
        showSuccessToast("Duty created successfully!");
        refreshList("refresh");
        onClose();
      } else {
        showErrorToast("Duty creation failed. Please try again.");
      }
    } catch (error: any) {
  if (error.status === 406) {
    showErrorToast("Duty already exists for this operator and service.");
  } else {
    showErrorToast(error.message || "Something went wrong. Please try again.");
  }
}finally {
      setLoading(false);
    }
  };

  const handleOperatorScroll = (event: React.UIEvent<HTMLElement>) => {
    const element = event.currentTarget;
    if (
      element.scrollHeight - element.scrollTop === element.clientHeight &&
      hasMoreOperators
    ) {
      const newPage = operatorPage + 1;
      setOperatorPage(newPage);
      fetchOperators(newPage, operatorSearch);
    }
  };

  const handleServiceScroll = (event: React.UIEvent<HTMLElement>) => {
    const element = event.currentTarget;
    if (
      element.scrollHeight - element.scrollTop === element.clientHeight &&
      hasMoreServices
    ) {
      const newPage = servicePage + 1;
      setServicePage(newPage);
      fetchServices(newPage);
    }
  };

  const renderOperatorAutocomplete = () => (
    <Controller
      name="operator_id"
      control={control}
      rules={{ required: "Operator is required" }}
      render={({ field }) => (
        <Autocomplete
          options={operatorList}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={operatorList.find((item) => item.id === field.value) || null}
          onChange={(_, newValue) => field.onChange(newValue?.id)}
          onInputChange={(_, newInputValue) => {
            setOperatorSearch(newInputValue);
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
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          ListboxProps={{
            onScroll: handleOperatorScroll,
            style: { maxHeight: 200, overflow: "auto" },
          }}
        />
      )}
    />
  );

  const renderServiceAutocomplete = () => (
    <Controller
      name="service_id"
      control={control}
      rules={{ required: "Service is required" }}
      render={({ field }) => (
        <Autocomplete
          options={serviceList}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={serviceList.find((item) => item.id === field.value) || null}
          onChange={(_, newValue) => field.onChange(newValue?.id)}
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
          renderOption={(props, option) => (
            <li {...props} key={option.id}>
              {option.name}
            </li>
          )}
          ListboxProps={{
            onScroll: handleServiceScroll,
            style: { maxHeight: 200, overflow: "auto" },
          }}
        />
      )}
    />
  );

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box sx={{
        mt: 4, mb: 4, px: 2, py: 3,
        borderRadius: 2, backgroundColor: "#f9f9f9", boxShadow: 3
      }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          Duty Creation
        </Typography>

        <Box component="form" noValidate onSubmit={handleSubmit(handleDutyCreation)}>
  <Stack 
    direction={{ xs: "column", sm: "row" }} 
    spacing={2} 
    sx={{ width: "100%" }}
  >
    <Box flex={1}>{renderOperatorAutocomplete()}</Box>
    <Box flex={1}>{renderServiceAutocomplete()}</Box>
  </Stack>

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