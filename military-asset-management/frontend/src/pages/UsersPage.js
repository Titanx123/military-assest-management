import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import {
  Container,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import UserForm from '../components/users/UserForm';

const UsersPage = () => {
  const { hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    if (hasRole('admin')) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [hasRole]);

  const fetchUsers = async () => {
    try {
      console.log('Starting to fetch users...');
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token in localStorage:', token);
      
      const response = await authAPI.getUsers();
      console.log('Users API response:', response);
      
      if (response.data) {
        console.log('Users data received:', response.data);
        setUsers(response.data);
      } else {
        console.error('No data in response:', response);
        setError('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching users:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      setError(err.response?.data?.msg || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setError('');
    setSuccess('');
    setOpenDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      setDeletingUserId(userToDelete._id);
      const response = await authAPI.deleteUser(userToDelete._id);
      
      if (response.status === 200) {
        setUsers(users.filter(u => u._id !== userToDelete._id));
        setSuccess('User deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Failed to delete user. Please try again.';
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    } finally {
      setOpenDialog(false);
      setUserToDelete(null);
      setDeletingUserId(null);
    }
  };

  if (!hasRole('admin')) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">You don't have permission to view this page</Alert>
      </Container>
    );
  }

  const handleUserCreated = async () => {
    try {
      await fetchUsers(); // Wait for users to be refreshed
      setShowAddForm(false);
      // Force a complete page reload to ensure clean state
      window.location.href = '/users';
    } catch (error) {
      console.error('Error in handleUserCreated:', error);
      // Fallback to simple navigation if there's an error
      window.location.href = '/users';
    }
  };

  if (showAddForm) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <UserForm 
          onSuccess={handleUserCreated} 
          onCancel={() => setShowAddForm(false)} 
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <IconButton onClick={() => window.history.back()} color="primary">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">User Management</Typography>
        </Box>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setShowAddForm(true)}
        >
          Add User
        </Button>
      </Box>

      {/* Success and Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Base</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Box 
                        component="span" 
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: user.role === 'admin' ? 'primary.light' : 
                                  user.role === 'commander' ? 'secondary.light' : 'grey.300',
                          color: user.role === 'officer' ? 'text.primary' : 'white',
                          textTransform: 'capitalize',
                        }}
                      >
                        {user.role}
                      </Box>
                    </TableCell>
                    <TableCell>{user.base}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        color="error" 
                        onClick={() => handleDeleteClick(user)}
                        disabled={user.role === 'admin' || deletingUserId === user._id}
                      >
                        {deletingUserId === user._id ? (
                          <CircularProgress size={24} />
                        ) : (
                          <DeleteIcon />
                        )}
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Delete User
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete user "{userToDelete?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersPage;
