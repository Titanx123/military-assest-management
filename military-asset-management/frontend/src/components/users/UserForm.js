import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, basesAPI } from 'utils/api';
import {
  Container,
  TextField,
  Button,
  Typography,
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'commander', label: 'Commander' },
  { value: 'officer', label: 'Officer' },
];

const UserForm = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const isModal = typeof onCancel === 'function';
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [bases, setBases] = useState([]);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    role: 'officer',
    base: '',
  });

  useEffect(() => {
    const fetchBases = async () => {
      try {
        const response = await basesAPI.getBases();
        // Ensure we have an array of base objects with _id and name
        const basesData = Array.isArray(response.data) 
          ? response.data 
          : [];
        
        setBases(basesData);
        
        // Set default base if user has access to only one base
        if (basesData.length === 1) {
          setFormData(prev => ({
            ...prev,
            base: basesData[0]._id // Store the base ID instead of the object
          }));
        }
      } catch (err) {
        console.error('Error fetching bases:', err);
        setError('Failed to load bases');
      } finally {
        setLoading(false);
      }
    };

    fetchBases();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await authAPI.registerAsAdmin(formData, token);
      // alert("hi", response.status)
      // console.clear()
      // console.log(response)
      if (response.status === 200) {
        setSuccess('User created successfully');
        
        // Reset form
        setFormData({
          username: '',
          password: '',
          name: '',
          role: 'officer',
          base: '',
        });
        // alert(window.location.href,"from try")
        // If this is a modal, call onSuccess
        if (isModal && onSuccess) {
          onSuccess();
          window.location.href = '/users'
        } else {
          // If not a modal, navigate after a short delay
          setTimeout(() => {
            window.location.href = '/users';
          }, 1000);
        }
      }
    } catch (err) {      
      console.error('Error creating user:', err);
      setError(err.response?.data?.msg || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Back
      </Button>
      
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom>
          Add New User
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        
        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            value={formData.username}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Password"
            type="password"
            id="password"
            autoComplete="new-password"
            value={formData.password}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="name"
            label="Full Name"
            name="name"
            autoComplete="name"
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
            <InputLabel id="role-label">Role</InputLabel>
            <Select
              labelId="role-label"
              id="role"
              name="role"
              value={formData.role}
              label="Role"
              onChange={handleChange}
              required
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <FormControl fullWidth margin="normal" sx={{ mb: 3 }}>
            <InputLabel id="base-label">Base</InputLabel>
            <Select
              labelId="base-label"
              id="base"
              name="base"
              value={formData.base}
              label="Base"
              onChange={handleChange}
              required
            >
              {bases.map((base) => {
                const baseId = base._id || base;
                const baseName = base.name || base;
                return (
                  <MenuItem key={baseId} value={baseId}>
                    {baseName}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create User'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default UserForm;
