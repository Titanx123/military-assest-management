import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { assetsAPI } from '../utils/api';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';

const AssetDetailPage = () => {
  const { id } = useParams();
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        setLoading(true);
        const response = await assetsAPI.getAsset(id);
        
        // Check if user has access to this asset
        if (user.role !== 'admin' && response.data.base !== user.base) {
          setError('You do not have permission to view this asset');
        } else {
          setAsset(response.data);
        }
      } catch (err) {
        console.error('Error fetching asset:', err);
        setError('Failed to load asset details');
      } finally {
        setLoading(false);
      }
    };

    fetchAsset();
  }, [id, user]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assetsAPI.deleteAsset(id);
      navigate('/dashboard', { state: { message: 'Asset deleted successfully' } });
    } catch (err) {
      console.error('Error deleting asset:', err);
      setError('Failed to delete asset');
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleEdit = () => {
    navigate(`/assets/edit/${id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" my={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box my={4}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </Box>
      </Container>
    );
  }

  if (!asset) return null;

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Box mb={3} display="flex" alignItems="center">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          
          <Box flexGrow={1} />
          
          {(hasRole(['admin', 'commander']) && user.base === asset.base) && (
            <>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleEdit}
                sx={{ mr: 1 }}
              >
                Edit
              </Button>
              
              {hasRole(['admin']) && (
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  Delete
                </Button>
              )}
            </>
          )}
        </Box>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Box mb={4}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h4" component="h1">
                {asset.name}
              </Typography>
              <Chip 
                label={asset.status.toUpperCase()} 
                color={
                  asset.status === 'available' ? 'success' : 
                  asset.status === 'maintenance' ? 'warning' :
                  asset.status === 'decommissioned' ? 'error' : 'info'
                } 
                variant="outlined"
              />
            </Box>
            
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              {asset.type.charAt(0).toUpperCase() + asset.type.slice(1)}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <DetailItem label="Serial Number" value={asset.serialNumber || 'N/A'} />
                <DetailItem label="Quantity" value={asset.quantity} />
                <DetailItem label="Assigned Quantity" value={asset.assignedQuantity || 0} />
              </Grid>
              <Grid item xs={12} md={6}>
                <DetailItem label="Base" value={asset.base} />
                <DetailItem 
                  label="Availability" 
                  value={`${asset.quantity - (asset.assignedQuantity || 0)} available`} 
                />
              </Grid>
              
              {asset.notes && (
                <Grid item xs={12}>
                  <DetailItem 
                    label="Notes" 
                    value={asset.notes} 
                    direction="column"
                  />
                </Grid>
              )}
              
              <Grid item xs={12}>
                <DetailItem 
                  label="Last Updated" 
                  value={new Date(asset.updatedAt).toLocaleString()} 
                />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Asset</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this asset? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained" 
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={20} /> : null}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

const DetailItem = ({ label, value, direction = 'row' }) => (
  <Box mb={2} display={direction === 'column' ? 'block' : 'flex'}>
    <Typography 
      variant="subtitle2" 
      color="textSecondary" 
      sx={{ 
        minWidth: direction === 'row' ? 180 : 'auto',
        mb: direction === 'column' ? 0.5 : 0,
        fontWeight: 'medium' 
      }}
    >
      {label}:
    </Typography>
    <Typography variant="body1">
      {value}
    </Typography>
  </Box>
);

export default AssetDetailPage;
