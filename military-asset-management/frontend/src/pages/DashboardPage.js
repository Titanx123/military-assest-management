import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assetsAPI } from '../utils/api';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const DashboardPage = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setLoading(true);
        const response = await assetsAPI.getAssets();
        setAssets(response.data);
      } catch (err) {
        setError('Failed to fetch assets');
        console.error('Error fetching assets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAssets();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this asset?')) {
      try {
        await assetsAPI.deleteAsset(id);
        setAssets(assets.filter(asset => asset._id !== id));
        showSnackbar('Asset deleted successfully');
      } catch (err) {
        console.error('Error deleting asset:', err);
        showSnackbar('Failed to delete asset', 'error');
      }
    }
  };

  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'type', headerName: 'Type', flex: 1 },
    { field: 'status', headerName: 'Status', flex: 1 },
    { field: 'base', headerName: 'Base', flex: 1 },
    { field: 'quantity', headerName: 'Quantity', flex: 1 },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      sortable: false,
      renderCell: (params) => (
        <>
          <Tooltip title="View">
            <IconButton onClick={() => navigate(`/assets/${params.row._id}`)}>
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          
          {(hasRole(['admin', 'commander'])) && (
            <Tooltip title="Edit">
              <IconButton onClick={() => navigate(`/assets/edit/${params.row._id}`)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {hasRole(['admin']) && (
            <Tooltip title="Delete">
              <IconButton onClick={() => handleDelete(params.row._id)}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ my: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            Asset Dashboard
          </Typography>
          
          <Box>
            {hasRole('admin') && (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => navigate('/users')}
                sx={{ mr: 2 }}
              >
                Manage Users
              </Button>
            )}
            {(hasRole(['admin', 'commander'])) && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => navigate('/assets/new')}
                sx={{ mr: 1 }}
              >
                Add Asset
              </Button>
            )}
            
            <Button 
              variant="outlined" 
              color="primary"
              onClick={logout}
            >
              Logout
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <div style={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={assets}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              getRowId={(row) => row._id}
              disableSelectionOnClick
            />
          </div>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default DashboardPage;
