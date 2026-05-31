import React from 'react';
import { Box, Typography, Button } from '@mui/material';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" color="error" gutterBottom>Erro ao renderizar a página</Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
            {String(this.state.error)}
            {this.state.error.stack ? '\n\n' + this.state.error.stack : ''}
          </Typography>
          <Button sx={{ mt: 2 }} variant="outlined" onClick={() => this.setState({ error: null })}>Tentar novamente</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
