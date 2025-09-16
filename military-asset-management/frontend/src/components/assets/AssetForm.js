import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { assetsAPI, basesAPI } from '../../utils/api';
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
  FormHelperText,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';

const assetTypes = [
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'weapon', label: 'Weapon' },
  { value: 'ammunition', label: 'Ammunition' },
  { value: 'equipment', label: 'Equipment' },
];

const statusOptions = [
  { value: 'available', label: 'Available' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'decommissioned', label: 'Decommissioned' },
];

const AssetForm = ({ isEdit = false }) => {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [bases, setBases] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    serialNumber: '',
    status: 'available',
    quantity: 1,
    base: user?.base || '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // If editing, fetch the asset data
        if (isEdit && id) {
          const response = await assetsAPI.getAsset(id);
          setFormData({
            name: response.data.name,
            type: response.data.type,
            serialNumber: response.data.serialNumber || '',
            status: response.data.status,
            quantity: response.data.quantity,
            base: response.data.base,
            notes: response.data.notes || '',
          });
        }
        
        // If admin, fetch all bases, otherwise just use the user's base
        if (hasRole(['admin'])) {
          const basesResponse = await basesAPI.getBases();
          setBases(basesResponse.data);
        } else {
          setBases([{ _id: user.base, name: user.base }]);
        }
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEdit, user, hasRole]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseInt(value, 10) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      if (isEdit && id) {
        await assetsAPI.updateAsset(id, formData);
      } else {
        await assetsAPI.createAsset(formData);
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('Error saving asset:', err);
      setError(err.response?.data?.message || 'Failed to save asset');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Box mb={3} display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            {isEdit ? 'Edit Asset' : 'Add New Asset'}
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3}>
              <Box gridColumn="span 6">
                <TextField
                  fullWidth
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  margin="normal"
                />
              </Box>

              <Box gridColumn="span 6">
                <FormControl fullWidth margin="normal" required>
                  <InputLabel id="type-label">Type</InputLabel>
                  <Select
                    labelId="type-label"
                    name="type"
                    value={formData.type}
                    label="Type"
                    onChange={handleChange}
                    required
                  >
                    {assetTypes.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box gridColumn="span 6">
                <TextField
                  fullWidth
                  label="Serial Number"
                  name="serialNumber"
                  value={formData.serialNumber}
                  onChange={handleChange}
                  margin="normal"
                />
              </Box>

              <Box gridColumn="span 6">
                <FormControl fullWidth margin="normal" required>
                  <InputLabel id="status-label">Status</InputLabel>
                  <Select
                    labelId="status-label"
                    name="status"
                    value={formData.status}
                    label="Status"
                    onChange={handleChange}
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status.value} value={status.value}>
                        {status.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box gridColumn="span 6">
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  margin="normal"
                  inputProps={{ min: 1 }}
                />
              </Box>

              <Box gridColumn="span 6">
                <FormControl fullWidth margin="normal" required>
                  <InputLabel id="base-label">Base</InputLabel>
                  <Select
                    labelId="base-label"
                    name="base"
                    value={formData.base}
                    label="Base"
                    onChange={handleChange}
                    required
                    disabled={!hasRole(['admin'])} // Only admin can change base
                  >
                    {bases.map((base) => (
                      <MenuItem key={base._id} value={base.name}>
                        {base.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box gridColumn="span 12">
                <TextField
                  fullWidth
                  label="Notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  margin="normal"
                  multiline
                  rows={4}
                />
              </Box>

              <Box gridColumn="span 12" mt={2} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={submitting}
                >
                  {isEdit ? 'Update Asset' : 'Save Asset'}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AssetForm;
