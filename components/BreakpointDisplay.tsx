"use client"

import React from 'react';
import { Grid, Typography } from '@mui/joy';
import { useMediaQuery, useTheme } from '@mui/material';

const BreakpointDisplay = () => {
  const theme = useTheme();
  
  // Verwendung von useMediaQuery, um den aktuellen Breakpoint zu ermitteln
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  let currentBreakpoint = null;

  if (isXs) currentBreakpoint = 'xs';
  else if (isSm) currentBreakpoint = 'sm';
  else if (isMd) currentBreakpoint = 'md';
  else if (isLg) currentBreakpoint = 'lg';
  else if (isXl) currentBreakpoint = 'xl';

  return (
    <Grid container alignItems="flex-end" sx={{ padding: 2 }}>
      <Grid>
        <Typography>Aktueller Breakpoint:</Typography>
        <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          {currentBreakpoint}
        </Typography>
      </Grid>
    </Grid>
  );
};

export default BreakpointDisplay;
