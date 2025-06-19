import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Divider,
  Chip,
  Grid,
  CircularProgress,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
} from '@mui/material';
import {  Person, Business, Phone, Email, Female, Male, Transgender } from '@mui/icons-material';
import { useDispatch } from 'react-redux';
import { operatorListApi } from '../../slices/appSlice';
import { companyListApi } from '../../slices/authSlice';
import localStorageHelper from '../../utils/localStorageHelper';
import { showErrorToast } from '../toastMessageHelper'; 

// Types
type Gender = 'Male' | 'Female' | 'Transgender' | 'Other';
type UserStatus = 'Active' | 'Suspended';
type CompanyStatus = 'Validating' | 'Verified' | 'Suspended';
type CompanyType = 'Private' | 'Government';

interface Company {
  id: number;
  name: string;
  contactPerson: string;
  location: string;
  phoneNumber: string;
  address: string;
  status: CompanyStatus;
  type: CompanyType;
}

interface UserProfile {
  id: number;
  username: string;
  gender: Gender;
  status: UserStatus;
  fullName: string;
  phoneNumber: string;
  emailId: string;
  company: Company;
}

const ProfilePage: React.FC = () => {
  const dispatch = useDispatch<any>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showCompany, setShowCompany] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const user = localStorageHelper.getItem('@user');
  const userId = user?.userId;
  const companyId = user?.company_id;

  const getGender = (value: number): Gender => {
    switch (value) {
      case 1: return 'Female';
      case 2: return 'Male';
      case 3: return 'Transgender';
      default: return 'Other';
    }
  };

  const getStatus = (value: number): UserStatus => {
    return value === 1 ? 'Active' : 'Suspended';
  };

  const getStatusColor = (status: UserStatus | CompanyStatus) => {
    switch (status) {
      case 'Active':
      case 'Verified':
        return 'success';
      case 'Validating':
        return 'warning';
      case 'Suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);

      const [accountRes, companyRes] = await Promise.all([
        dispatch(operatorListApi({ id: userId, limit: 1, offset: 0 })).unwrap(),
        dispatch(companyListApi({ id: companyId, limit: 1, offset: 0 })).unwrap(),
      ]);

      const user = accountRes.data?.[0]; 
      const company = companyRes.data?.[0];

      if (user && company) {
        setProfile({
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          gender: getGender(user.gender),
          status: getStatus(user.status),
          emailId: user.email_id,
          phoneNumber: user.phone_number,
          company: {
            id: company.id,
            name: company.name,
            contactPerson: company.contact_person,
            location: company.location,
            phoneNumber: company.phone_number,
            address: company.address,
            status: company.status,
            type: company.type,
          },
        });
      }
    } catch (error: any) {
      showErrorToast(error.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, userId, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h6">No profile data available.</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {!showCompany ? (
        // Profile View
        <Box sx={{ maxWidth: 600, margin: '0 auto' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Avatar
              sx={{
                width: 120,
                height: 120,
                fontSize: 48,
                margin: '0 auto 16px',
                bgcolor: 'primary.main',
              }}
            >
              {profile.fullName.charAt(0)}
            </Avatar>
            <Typography variant="h4" fontWeight="bold">
              {profile.fullName}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              @{profile.username}
            </Typography>
            <Chip
              label={profile.status}
              color={getStatusColor(profile.status)}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>

          <Card elevation={3} sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={3}>
                {[
                  { icon: <Person />, label: 'Full Name', value: profile.fullName },
                  { icon: <Phone />, label: 'Phone', value: profile.phoneNumber },
                  { icon: <Email />, label: 'Email', value: profile.emailId },
                  {
                    icon: profile.gender === 'Male' ? <Male /> : 
                          profile.gender === 'Female' ? <Female /> : <Transgender />,
                    label: 'Gender',
                    value: profile.gender,
                  },
                ].map((item, index) => (
                  <React.Fragment key={index}>
                    <Grid item xs={12} sm={6}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: 'action.selected' }}>{item.icon}</Avatar>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            {item.label}
                          </Typography>
                          <Typography variant="body1">{item.value}</Typography>
                        </Box>
                      </Stack>
                    </Grid>
                  </React.Fragment>
                ))}
              </Grid>
            </CardContent>
          </Card>

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<Business />}
              onClick={() => setShowCompany(true)}
              sx={{ px: 4 }}
            >
              View Company Details
            </Button>
          </Box>
        </Box>
      ) : (
        // Company Details View
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Card elevation={3}>
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 100,
                      height: 100,
                      fontSize: 40,
                      margin: '0 auto 16px',
                      bgcolor: 'secondary.main',
                    }}
                  >
                    {profile.company.name.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" fontWeight="bold">
                    {profile.company.name}
                  </Typography>
                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                    <Chip
                      label={profile.company.status}
                      color={getStatusColor(profile.company.status)}
                      size="small"
                    />
                    <Chip
                      label={profile.company.type}
                      color={profile.company.type === 'Private' ? 'primary' : 'secondary'}
                      size="small"
                    />
                  </Stack>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  {[
                    { label: 'Contact Person', value: profile.company.contactPerson },
                    { label: 'Location', value: profile.company.location },
                    { label: 'Phone', value: profile.company.phoneNumber },
                    { label: 'Address', value: profile.company.address },
                  ].map((item, index) => (
                    <Grid item xs={12} key={index}>
                      <Typography variant="subtitle2" color="text.secondary">
                        {item.label}
                      </Typography>
                      <Typography variant="body1" sx={{ wordBreak: 'break-word' }}>
                        {item.value}
                      </Typography>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <Card elevation={3}>
                <CardContent>
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        fontSize: 32,
                        margin: '0 auto 16px',
                        bgcolor: 'primary.main',
                      }}
                    >
                      {profile.fullName.charAt(0)}
                    </Avatar>
                    <Typography variant="h6">{profile.fullName}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                      @{profile.username}
                    </Typography>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => setShowCompany(false)}
                    sx={{ mt: 2 }}
                  >
                    Back to Profile
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Grid>
        </Grid>
      )}
    </Container>
  );
};

export default ProfilePage;
